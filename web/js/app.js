class RosClient {
  constructor(statusElement) {
    this.statusElement = statusElement;
    this.ros = null;
    this.cmdVelTopic = null;
    this.rawTopic = null;
    this.telemetryTopic = null;
    this.telemetryHandler = null;
    this.controlHandler = null;
    this.controlVelocityHandler = null;
  }

  connect(url) {
    if (this.ros) {
      this.ros.close();
    }

    this.setStatus('Connecting', 'text-bg-warning');
    this.ros = new ROSLIB.Ros({ url });

    this.ros.on('connection', () => {
      this.setStatus('ROS connected', 'text-bg-success');
      this.setupTopics();
    });

    this.ros.on('error', () => {
      this.setStatus('ROS error', 'text-bg-danger');
    });

    this.ros.on('close', () => {
      this.setStatus('ROS disconnected', 'text-bg-secondary');
    });
  }

  setupTopics() {
    this.cmdVelTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: '/guppy/cmd_vel',
      messageType: 'geometry_msgs/msg/Twist',
    });

    this.rawTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: '/guppy/cmd_raw',
      messageType: 'guppy_interface/msg/GuppyDriverTransmitted',
    });

    this.telemetryTopic = new ROSLIB.Topic({
      ros: this.ros,
      name: '/Guppy_Received',
      messageType: 'guppy_interface/msg/GuppyDriverReceived',
    });

    this.controlTopic = this.rawTopic;

    if (this.telemetryHandler) {
      this.telemetryTopic.subscribe(this.telemetryHandler);
    }

    if (this.controlHandler) {
      this.controlTopic.subscribe(this.controlHandler);
    }

    if (this.controlVelocityHandler) {
      this.cmdVelTopic.subscribe(this.controlVelocityHandler);
    }
  }

  onTelemetry(callback) {
    this.telemetryHandler = callback;
    if (this.telemetryTopic) {
      this.telemetryTopic.subscribe(callback);
    }
  }

  onControl(callback) {
    this.controlHandler = callback;
    if (this.controlTopic) {
      this.controlTopic.subscribe(callback);
    }
  }

  onControlVelocity(callback) {
    this.controlVelocityHandler = callback;
    if (this.cmdVelTopic) {
      this.cmdVelTopic.subscribe(callback);
    }
  }

  publishCmdVel(command) {
    if (!this.cmdVelTopic) {
      return;
    }

    this.cmdVelTopic.publish(new ROSLIB.Message({
      linear: {
        x: command.surge,
        y: command.sway,
        z: command.heave,
      },
      angular: {
        x: 0,
        y: 0,
        z: command.yaw,
      },
    }));
  }

  publishRaw(command) {
    if (!this.rawTopic) {
      return;
    }

    this.rawTopic.publish(new ROSLIB.Message(command));
  }

  setStatus(text, className) {
    this.statusElement.className = `badge ${className}`;
    this.statusElement.textContent = text;
  }
}

class KeyboardController {
  constructor(rosClient) {
    this.rosClient = rosClient;
    this.keys = new Set();
    this.buttonDeadman = false;
    this.shiftDeadman = false;
    this.command = { surge: 0, sway: 0, heave: 0, yaw: 0 };
    this.scaleInput = document.getElementById('command-scale');
    this.deadmanStatus = document.getElementById('deadman-status');
    this.bindEvents();
    window.setInterval(() => this.tick(), 100);
  }

  bindEvents() {
    document.addEventListener('keydown', (event) => {
      if (event.repeat) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        this.stop();
      }
      if (event.key === 'Shift') {
        this.shiftDeadman = true;
      }
      this.keys.add(event.key.toLowerCase());
      this.updateDeadmanStatus();
    });

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') {
        this.shiftDeadman = false;
      }
      this.keys.delete(event.key.toLowerCase());
      this.updateDeadmanStatus();
    });

    const deadmanButton = document.getElementById('deadman-button');
    ['mousedown', 'touchstart'].forEach((name) => {
      deadmanButton.addEventListener(name, (event) => {
        event.preventDefault();
        this.buttonDeadman = true;
        this.updateDeadmanStatus();
      });
    });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((name) => {
      deadmanButton.addEventListener(name, () => {
        this.buttonDeadman = false;
        this.updateDeadmanStatus();
        this.stop();
      });
    });

    document.getElementById('stop-button').addEventListener('click', () => this.stop());
  }

  deadmanActive() {
    return this.buttonDeadman || this.shiftDeadman;
  }

  updateDeadmanStatus() {
    if (this.deadmanActive()) {
      this.deadmanStatus.className = 'badge text-bg-success';
      this.deadmanStatus.textContent = 'Enabled';
      return;
    }

    this.deadmanStatus.className = 'badge text-bg-danger';
    this.deadmanStatus.textContent = 'Disabled';
  }

  tick() {
    const command = this.computeCommand();
    this.command = command;
    this.renderCommand();

    if (this.deadmanActive()) {
      this.rosClient.publishCmdVel(command);
    }
  }

  computeCommand() {
    const scale = Number.parseFloat(this.scaleInput.value) || 0;
    const command = { surge: 0, sway: 0, heave: 0, yaw: 0 };

    if (this.keys.has('w')) {
      command.surge += scale;
    }
    if (this.keys.has('s')) {
      command.surge -= scale;
    }
    if (this.keys.has('d')) {
      command.sway += scale;
    }
    if (this.keys.has('a')) {
      command.sway -= scale;
    }
    if (this.keys.has('r')) {
      command.heave += scale;
    }
    if (this.keys.has('f')) {
      command.heave -= scale;
    }
    if (this.keys.has('q')) {
      command.yaw += scale;
    }
    if (this.keys.has('e')) {
      command.yaw -= scale;
    }

    return command;
  }

  stop() {
    this.keys.clear();
    this.command = { surge: 0, sway: 0, heave: 0, yaw: 0 };
    this.renderCommand();
    this.rosClient.publishCmdVel(this.command);
  }

  renderCommand() {
    document.getElementById('cmd-surge').textContent = this.command.surge.toFixed(2);
    document.getElementById('cmd-sway').textContent = this.command.sway.toFixed(2);
    document.getElementById('cmd-heave').textContent = this.command.heave.toFixed(2);
    document.getElementById('cmd-yaw').textContent = this.command.yaw.toFixed(2);
  }
}

class TelemetryView {
  constructor() {
    this.lastTelemetryTime = null;
    window.setInterval(() => this.renderAge(), 500);
  }

  update(message) {
    this.lastTelemetryTime = Date.now();
    this.setValue('roll', message.roll);
    this.setValue('pitch', message.pitch);
    this.setValue('yaw', message.yaw);
    this.setValue('depth', message.depth);
    this.setValue('water', message.water);
    this.setValue('volt', message.volt);
    this.setValue('amp', message.amp);
    this.renderAge();
  }

  setValue(name, value) {
    document.getElementById(`telemetry-${name}`).textContent = value;
  }

  renderAge() {
    const element = document.getElementById('telemetry-age');
    if (!this.lastTelemetryTime) {
      element.className = 'badge text-bg-secondary';
      element.textContent = 'No data';
      return;
    }

    const age = (Date.now() - this.lastTelemetryTime) / 1000;
    element.className = age < 1.5 ? 'badge text-bg-success' : 'badge text-bg-warning';
    element.textContent = `${age.toFixed(1)}s old`;
  }
}

class ControlView {
  constructor() {
    this.lastControlTime = null;
    window.setInterval(() => this.renderAge(), 500);
  }

  update(message) {
    this.lastControlTime = Date.now();
    this.setSource('cmd_raw');
    this.setValue('surge', message.surge);
    this.setValue('sway', message.sway);
    this.setValue('yaw', message.yaw);
    this.setValue('heave', message.heave);
    this.setValue('s1', message.s1);
    this.setValue('s2', message.s2);
    this.setValue('o1', message.o1);
    this.setValue('o2', message.o2);
    this.setValue('o3', message.o3);
    this.setValue('o4', message.o4);
    this.renderAge();
  }

  updateVelocity(twist) {
    // /guppy/cmd_vel arrives normalized (-1..1); the driver scales it to MCU units.
    this.lastControlTime = Date.now();
    this.setSource('cmd_vel');
    this.setValue('surge', formatAxis(twist.linear.x));
    this.setValue('sway', formatAxis(twist.linear.y));
    this.setValue('heave', formatAxis(twist.linear.z));
    this.setValue('yaw', formatAxis(twist.angular.z));
    this.renderAge();
  }

  setSource(name) {
    const element = document.getElementById('control-source');
    element.textContent = name;
    element.className = name === 'cmd_raw' ? 'badge text-bg-primary' : 'badge text-bg-info';
  }

  setValue(name, value) {
    document.getElementById(`control-${name}`).textContent = value;
  }

  renderAge() {
    const element = document.getElementById('control-age');
    if (!this.lastControlTime) {
      element.className = 'badge text-bg-secondary';
      element.textContent = 'No data';
      return;
    }

    const age = (Date.now() - this.lastControlTime) / 1000;
    element.className = age < 1.5 ? 'badge text-bg-success' : 'badge text-bg-warning';
    element.textContent = `${age.toFixed(1)}s old`;
  }
}

function formatAxis(value) {
  return Number(value).toFixed(2);
}

function readRawCommand() {
  const field = (name) => Number.parseInt(document.getElementById(`raw-${name}`).value, 10) || 0;
  return {
    surge: field('surge'),
    sway: field('sway'),
    yaw: field('yaw'),
    heave: field('heave'),
    s1: field('s1'),
    s2: field('s2'),
    o1: field('o1'),
    o2: field('o2'),
    o3: field('o3'),
    o4: field('o4'),
  };
}

function refreshCamera() {
  const topic = encodeURIComponent(document.getElementById('camera-topic').value);
  const port = document.getElementById('video-port').value || '8080';
  const image = document.getElementById('camera-stream');
  image.src = `${window.location.protocol}//${window.location.hostname}:${port}/stream?topic=${topic}`;
}

window.addEventListener('DOMContentLoaded', () => {
  const rosClient = new RosClient(document.getElementById('ros-status'));
  const telemetryView = new TelemetryView();
  const controlView = new ControlView();
  new KeyboardController(rosClient);

  rosClient.onTelemetry((message) => telemetryView.update(message));
  rosClient.onControl((message) => controlView.update(message));
  rosClient.onControlVelocity((message) => controlView.updateVelocity(message));

  document.getElementById('connect-ros').addEventListener('click', () => {
    rosClient.connect(document.getElementById('rosbridge-url').value);
  });

  document.getElementById('publish-raw').addEventListener('click', () => {
    rosClient.publishRaw(readRawCommand());
  });

  document.getElementById('refresh-camera').addEventListener('click', refreshCamera);
  refreshCamera();
});
