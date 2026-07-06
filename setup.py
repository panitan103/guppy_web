from glob import glob

from setuptools import find_packages, setup

package_name = 'guppy_web'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', glob('launch/*.launch.py')),
        ('share/' + package_name + '/web', glob('web/*.html')),
        ('share/' + package_name + '/web/css', glob('web/css/*.css')),
        ('share/' + package_name + '/web/js', glob('web/js/*.js')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='moonway',
    maintainer_email='panitan103_54@yahoo.com',
    description='Web ground-control dashboard for the Guppy ROV.',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
            'guppy_web_server = guppy_web.web_server:main',
        ],
    },
)
