precision highp float;

#pragma glslify: noise = require('glsl-noise/classic/3d')

uniform float u_map_dimensions;
uniform sampler2D u_texmap;
uniform vec2 u_light_position[100];
uniform float u_light_intensity[100];
uniform bool u_light_enabled[100];
uniform float u_ambient_light;
uniform float u_time;

varying vec2 v_texcoord;
varying vec2 v_world_pos;
varying vec4 v_color;

const float PI = 3.1415926535897932384626433832795;

void main() {
  float brightness = u_ambient_light;

  for (int i = 0; i < 100; i++) {
    if (u_light_enabled[i]) {
      vec2 diff = v_world_pos - u_light_position[i];
      float dist = distance(v_world_pos, u_light_position[i]);
      float attenuation = 1.0 / (1.0 + (0.05 * dist) + (0.005 * dist * dist));
      vec2 diffNorm = normalize(diff);
      float rayBrightness = 0.05 * u_light_intensity[i];
      float rayContribution = noise(vec3(diffNorm * 10.0, u_time)) * rayBrightness / 2.0 - rayBrightness;
      brightness += u_light_intensity[i] * attenuation + rayContribution;
    }
  }

  vec4 sampledColor = texture2D(
    u_texmap,
    vec2(v_texcoord.s / u_map_dimensions, v_texcoord.t / u_map_dimensions)
  );
  gl_FragColor = vec4(sampledColor.rgb * brightness * v_color.rgb, sampledColor.a * v_color.a);
}
