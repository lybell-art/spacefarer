// 출처:https://github.com/aferriss/p5jsShaderExamples/blob/gh-pages/6_3d/6-2_vertexDisplacement/shader.vert

attribute vec3 aPosition;
attribute vec2 aTexCoord;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;
uniform float uFrameCount;

varying vec2 vTexCoord;
varying vec3 vNormal;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  float frequency = 20.0;
  float amplitude = 0.15;
  float distortion = sin(positionVec4.x * frequency + uFrameCount * 0.1);
  positionVec4.x += distortion * aNormal.x * amplitude;

  vNormal = aNormal;

  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;

  vTexCoord = aTexCoord;
}
