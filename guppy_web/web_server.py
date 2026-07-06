"""Flask-backed static web server node for the Guppy dashboard."""

from pathlib import Path
from threading import Thread

from ament_index_python.packages import get_package_share_directory
import rclpy
from rclpy.node import Node

try:
    from flask import Flask
    from flask import send_from_directory
    from werkzeug.serving import make_server
except ImportError as exc:
    Flask = None
    make_server = None
    send_from_directory = None
    FLASK_IMPORT_ERROR = exc
else:
    FLASK_IMPORT_ERROR = None


class GuppyWebServerNode(Node):
    """Host the Guppy static dashboard from inside a ROS 2 node."""

    def __init__(self):
        super().__init__('guppy_web_server')
        self.declare_parameter('host', '0.0.0.0')
        self.declare_parameter('port', 8000)
        self.declare_parameter('web_root', '')

        self.host = self.get_parameter('host').get_parameter_value().string_value
        self.port = self.get_parameter('port').get_parameter_value().integer_value
        self.web_root = self.resolve_web_root()

        if Flask is None:
            raise RuntimeError(
                'Flask is required for guppy_web_server. Install python3-flask.'
            ) from FLASK_IMPORT_ERROR

        self.app = self.create_app()
        self.server = make_server(self.host, self.port, self.app, threaded=True)
        self.server_thread = Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()
        self.get_logger().info(
            f'Hosting Guppy web UI at http://{self.host}:{self.port}')

    def resolve_web_root(self):
        """Return the configured web root or the installed package web directory."""
        configured_root = self.get_parameter(
            'web_root').get_parameter_value().string_value
        if configured_root:
            return Path(configured_root).expanduser().resolve()

        package_share = Path(get_package_share_directory('guppy_web'))
        return package_share / 'web'

    def create_app(self):
        """Create the Flask app and static routes."""
        app = Flask(
            __name__,
            static_folder=str(self.web_root),
            static_url_path='',
        )

        @app.route('/')
        def index():
            return send_from_directory(self.web_root, 'index.html')

        @app.route('/<path:filename>')
        def static_file(filename):
            return send_from_directory(self.web_root, filename)

        return app

    def destroy_node(self):
        """Stop the HTTP server before shutting down the ROS node."""
        if hasattr(self, 'server'):
            self.server.shutdown()
        return super().destroy_node()


def main(args=None):
    """Run the Guppy web server node."""
    rclpy.init(args=args)
    node = GuppyWebServerNode()

    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
