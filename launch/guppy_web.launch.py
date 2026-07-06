"""Launch the Guppy web dashboard, rosbridge, and video server."""

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    """Generate the Guppy web stack launch description."""
    host = LaunchConfiguration('host')
    port = LaunchConfiguration('port')
    rosbridge_port = LaunchConfiguration('rosbridge_port')
    video_port = LaunchConfiguration('video_port')

    return LaunchDescription([
        DeclareLaunchArgument(
            'host',
            default_value='0.0.0.0',
            description='Host address for the Guppy web UI.'),
        DeclareLaunchArgument(
            'port',
            default_value='8000',
            description='HTTP port for the Guppy web UI.'),
        DeclareLaunchArgument(
            'rosbridge_port',
            default_value='9090',
            description='WebSocket port for rosbridge.'),
        DeclareLaunchArgument(
            'video_port',
            default_value='8080',
            description='HTTP port for web_video_server.'),
        Node(
            package='guppy_web',
            executable='guppy_web_server',
            name='guppy_web_server',
            output='screen',
            parameters=[{
                'host': host,
                'port': port,
            }],
        ),
        Node(
            package='rosbridge_server',
            executable='rosbridge_websocket',
            name='rosbridge_websocket',
            output='screen',
            parameters=[{
                'port': rosbridge_port,
            }],
        ),
        Node(
            package='web_video_server',
            executable='web_video_server',
            name='web_video_server',
            output='screen',
            parameters=[{
                'port': video_port,
            }],
        ),
    ])
