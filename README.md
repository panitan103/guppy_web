# guppy_web

ROS 2 package for the Guppy web ground-control MVP.

## Role In The System

`guppy_web` hosts the browser dashboard and starts the web-facing ROS tools.

- Flask serves the static Bootstrap dashboard.
- `rosbridge_websocket` lets the browser publish/subscribe ROS 2 topics through
  roslibjs.
- `web_video_server` exposes ROS image topics to the browser as an HTTP stream.
- Hosted documentation pages record the concept, plan, and dev log.

The package does not talk directly to the MCU. MCU communication stays in
`guppy`.

## Runtime Dependencies

Install before launching the full web stack:

```bash
sudo apt install python3-flask ros-jazzy-rosbridge-suite ros-jazzy-web-video-server
```

## Launch

Build first:

```bash
colcon build --packages-select guppy_interface guppy guppy_web
source install/setup.bash
```

Launch:

```bash
ros2 launch guppy_web guppy_web.launch.py
```

Default services:

- Dashboard: `http://<sbc-ip>:8000`
- Rosbridge websocket: `ws://<sbc-ip>:9090`
- Video server: `http://<sbc-ip>:8080`

Useful launch parameters:

- `host`: default `0.0.0.0`.
- `port`: dashboard HTTP port, default `8000`.
- `rosbridge_port`: websocket port, default `9090`.
- `video_port`: video HTTP port, default `8080`.

## Web UI MVP

The dashboard is Bootstrap-based, clean, informative, and operational.
Dark mode is the default. The dashboard and hosted dev pages include a
light/dark switch that stores the preference in browser localStorage.

Current panels:

- Camera stream.
- ROS connection status.
- Telemetry from `/guppy/telemetry`.
- Keyboard control publishing `/guppy/cmd_vel`.
- Advanced raw command panel publishing `/guppy/cmd_raw`.
- Stop button.

Keyboard default:

- `W/S`: surge.
- `A/D`: sway.
- `Q/E`: yaw.
- `R/F`: heave.
- `Space`: stop.
- Hold `Shift` or the on-screen deadman button to publish live keyboard
  commands.

Future controller support should stay browser-side first. FlySky i6S/gamepad
work can reuse the same command publisher that the keyboard controller uses.

## Hosted Dev Pages

When the dashboard is running:

- `/dev-plan.html`: concept, architecture, design philosophy, current MVP, and
  future ideas.
- `/dev-log.html`: dated implementation log, test results, feedback, and commit
  hashes.

## Hardware Context

The current MCU firmware source is here:

<https://github.com/panitan103/TEENSY_40_YOUYEETOO.git>

Important current hardware facts:

- PCA9685, BNO055, and MS5837 are connected in the MCU firmware.
- No servo is attached to the MCU right now.
- The web UI should not assume a working camera servo control until hardware
  and firmware support are added.

## Development

Build and test:

```bash
colcon build --packages-select guppy_web
colcon test --packages-select guppy_web
colcon test-result --verbose
```

This package has its own git repository. Commit every coherent change locally;
push is manual.
