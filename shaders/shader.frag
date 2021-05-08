//출처 : https://github.com/aferriss/p5jsShaderExamples/blob/gh-pages/6_3d/6-2_vertexDisplacement/shader.frag

precision mediump float;

varying vec2 vTexCoord;
varying vec3 vNormal;

void main() {
  vec3 color = vNormal * 0.5 + 0.5;
  gl_FragColor = vec4(color ,1.0);
}