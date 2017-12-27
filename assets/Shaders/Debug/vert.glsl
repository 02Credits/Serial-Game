attribute vec3 a_coord;

uniform vec4 u_camera_dimensions;

void main() {
  gl_Position = vec4((a_coord.xy - u_camera_dimensions.xy) / (u_camera_dimensions.zw / 2.0), 0, 1);
}
