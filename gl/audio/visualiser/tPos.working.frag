precision highp float;
precision highp sampler2D;

uniform float time;
uniform sampler2D tIdx;
uniform sampler2D tAudio;

#define M_PI 3.1415926535897932384626433832795
float atan2(in float y, in float x) {
	bool xgty = (abs(x) > abs(y));
	return mix(M_PI/2.0 - atan(x,y), atan(y,x), float(xgty));
}
vec3 fromBall(float r, float az, float el) {
	return vec3(
    r * cos(el) * cos(az),
    r * cos(el) * sin(az),
    r * sin(el)
  );
}
void toBall(vec3 pos, out float az, out float el) {
	az = atan2(pos.y, pos.x);
	el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
}
// float az = 0.0;
// float el = 0.0;
// vec3 noiser = vec3(lastVel);
// toBall(noiser, az, el);
// lastVel.xyz = fromBall(1.0, az, el);

//
//	Classic Perlin 3D Noise
//	by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm ( in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float pattern( in vec2 p )
{
    vec2 q = vec2( fbm( p + vec2(0.0,0.0) ),
                    fbm( p + vec2(5.2,1.3) ) );

    vec2 r = vec2( fbm( p + 4.0*q + vec2(1.7,9.2) ),
                    fbm( p + 4.0*q + vec2(8.3,2.8) ) );

    return fbm( p + 4.0*r );
}

mat3 rotateX(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        1.0, 0.0, 0.0,
        0.0, c, s,
        0.0, -s, c
    );
}

mat3 rotateY(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

mat3 rotateZ(float rad) {
    float c = cos(rad);
    float s = sin(rad);
    return mat3(
        c, s, 0.0,
        -s, c, 0.0,
        0.0, 0.0, 1.0
    );
}

mat3 rotateQ (vec3 axis, float rad) {
    float hr = rad / 2.0;
    float s = sin( hr );
    vec4 q = vec4(axis * s, cos( hr ));
    vec3 q2 = q.xyz + q.xyz;
    vec3 qq2 = q.xyz * q2;
    vec2 qx = q.xx * q2.yz;
    float qy = q.y * q2.z;
    vec3 qw = q.w * q2.xyz;

    return mat3(
        1.0 - (qq2.y + qq2.z),  qx.x - qw.z,            qx.y + qw.y,
        qx.x + qw.z,            1.0 - (qq2.x + qq2.z),  qy - qw.x,
        qx.y - qw.y,            qy + qw.x,              1.0 - (qq2.x + qq2.y)
    );
}

const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923;
const float PI_4 = 0.785398163397448309616;

mat4 scale(float x, float y, float z){
    return mat4(
        vec4(x,   0.0, 0.0, 0.0),
        vec4(0.0, y,   0.0, 0.0),
        vec4(0.0, 0.0, z,   0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}

mat4 translate(float x, float y, float z){
    return mat4(
        vec4(1.0, 0.0, 0.0, 0.0),
        vec4(0.0, 1.0, 0.0, 0.0),
        vec4(0.0, 0.0, 1.0, 0.0),
        vec4(x,   y,   z,   1.0)
    );
}

mat4 RotateX(float phi){
    return mat4(
        vec4(1.,0.,0.,0),
        vec4(0.,cos(phi),-sin(phi),0.),
        vec4(0.,sin(phi),cos(phi),0.),
        vec4(0.,0.,0.,1.));
}

mat4 RotateY(float theta){
    return mat4(
        vec4(cos(theta),0.,-sin(theta),0),
        vec4(0.,1.,0.,0.),
        vec4(sin(theta),0.,cos(theta),0.),
        vec4(0.,0.,0.,1.));
}

mat4 RotateZ(float psi){
    return mat4(
        vec4(cos(psi),-sin(psi),0.,0),
        vec4(sin(psi),cos(psi),0.,0.),
        vec4(0.,0.,1.,0.),
        vec4(0.,0.,0.,1.));
}

struct GeoReader {
  vec4 position;
  vec4 indexer;
  bool shouldSkipRender;
};

GeoReader GetGeoReader () {
  bool shouldSkipRender = false;
  vec2 cellSize = 1.0 / resolution.xy;
  vec2 newCell = gl_FragCoord.xy;
  vec2 uv = newCell * cellSize;
  vec4 oldPos = texture2D(tPos, uv);
  vec4 idx = texture2D(tIdx, uv);

  // float vertexID = idx.w;
  // float squareVertexID = idx.x;
  // float squareIDX = idx.y;
  // float totalSquares = idx.z;

  return GeoReader(oldPos, idx, shouldSkipRender);
}

void toPrimitive (inout vec2 rect, inout vec4 pos, float squareVertexID, inout bool shouldSkipRender) {
  if (squareVertexID == 0.0) {
    pos.x = 1.0 * rect.x; //Width;
    pos.y = 1.0 * rect.y; //Height;
    pos.z = 0.0;
  } else if (squareVertexID == 1.0) {
    pos.x = -1.0 * rect.x; //Width;
    pos.y = 1.0 * rect.y; //Height;
    pos.z = 0.0;
  } else if (squareVertexID == 2.0) {
    pos.x = -1.0 * rect.x; //Width;
    pos.y = -1.0 * rect.y; //Height;
    pos.z = 0.0;
  } else if (squareVertexID == 3.0) {
    pos.x = 1.0 * rect.x; //Width;
    pos.y = 1.0 * rect.y; //Height;
    pos.z = 0.0;
  } else if (squareVertexID == 4.0) {
    pos.x = -1.0 * rect.x; //Width;
    pos.y = -1.0 * rect.y; //Height;
    pos.z = 0.0;
  } else if (squareVertexID == 5.0) {
    pos.x = 1.0 * rect.x; //Width;
    pos.y = -1.0 * rect.y; //Height;
    pos.z = 0.0;
  } else {
    shouldSkipRender = true;
  }
}

struct Square {
  float xID;
  float yID;
  float xSize;
  float ySize;
  bool shouldSkipRender;
  vec4 vertex;
};

Square GetPlane (GeoReader reader, vec2 plane, vec2 gap)  {
  bool shouldSkipRender = reader.shouldSkipRender;
  vec4 idx = reader.indexer;
  vec4 oldPos = reader.position;

  float vertexID = idx.w;
  float squareVertexID = idx.x;
  float squareIDX = idx.y;
  float totalSquares = idx.z;

  vec4 pos = vec4(0.0);
  float dimension = pow(idx.z, 0.5);
  float stackIDX = floor(squareIDX / dimension);
  float lineIDX = mod(squareIDX, dimension);

  if (squareIDX > dimension * dimension) {
    shouldSkipRender = true;
  }

  float planeWidth = plane.x;
  float planeHeight = plane.y;

  float w = planeWidth * (2.0) + gap.x;
  float h = planeHeight * (2.0) + gap.y;

  float offsetX = (w * lineIDX) - (w * dimension * 0.5);
  float offsetY = (h * stackIDX) - (h * dimension * 0.5);
  vec3 offsetXYZ = vec3(offsetX, offsetY, 0.0);

  toPrimitive(plane, pos, squareVertexID, shouldSkipRender);

  pos.xyz += offsetXYZ;

  Square square = Square(lineIDX, stackIDX, dimension, dimension, shouldSkipRender, pos);

  return square;
}


struct Sphere {
  bool shouldSkipRender;
  vec4 idx;
  vec4 vertex;
  vec3 sphereIDX;
};

Sphere GetSphere (GeoReader reader, vec2 rect)  {
  bool shouldSkipRender = reader.shouldSkipRender;
  vec4 idx = reader.indexer;

  float vertexID = idx.w;
  float squareVertexID = idx.x;
  float squareIDX = idx.y;

  float totalSquares = idx.z;

  float dimension = pow(totalSquares, 1.0 / 3.0);
  float cubeID = mod(squareIDX, dimension);

  float xx = mod(cubeID * pow(dimension, 0.0), dimension);
  float yy = mod(cubeID * pow(dimension, 1.0), dimension);
  float zz = mod(cubeID * pow(dimension, 2.0), dimension);

  vec3 finalXYZ = vec3(xx, yy, zz);

  float adjustToCenter = dimension * -0.5;
  finalXYZ += adjustToCenter;

  float changeTo = 1.0 / dimension;
  finalXYZ *= changeTo;

  vec4 offset = vec4(finalXYZ, 1.0) * 50.0;

  float az = 0.0;
  float el = 0.0;
  vec3 virtualBall = vec3(offset.xyz);
  toBall(virtualBall, az, el);

  // if (squareIDX > totalSquares * 0.33333) {
  //   shouldSkipRender = true;
  // }

  vec4 pos = vec4(0.0);

  toPrimitive(rect, pos, squareVertexID, shouldSkipRender);

  pos.xyz += fromBall(50.0, az, el);

  Sphere sphere = Sphere(shouldSkipRender, idx, pos, finalXYZ);

  return sphere;
}

struct Audio {
  float range;
  float amount;
};

Audio GetAudio (GeoReader reader) {
  vec4 idx = reader.indexer;
  float vertexID = idx.w;
  float squareVertexID = idx.x;
  float squareIDX = idx.y;
  float totalSquares = idx.z;

  vec2 audioTextureDimension = vec2(
    totalSquares * 2.0,
    1.0
  );
  vec2 audioUV = vec2(mod(squareIDX, audioTextureDimension.x), 0.0) / audioTextureDimension;

  vec4 audioInfo = texture2D(tAudio, audioUV);
  float amount = audioInfo.r;

  return Audio(audioUV.x, amount);
}

vec3 ballify (vec3 pos, float r) {
  float az = atan2(pos.y, pos.x);
  float el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
  return vec3(
    r * cos(el) * cos(az),
    r * cos(el) * sin(az),
    r * sin(el)
  );
}

void main ()	{
  GeoReader reader = GetGeoReader();

  // -------
  Audio audio = GetAudio(reader);
  float amount = audio.amount;
  float range = audio.range;

  // -------

  //------ START READING ME --------
  vec2 planeSize = vec2(
    0.03333333 * 0.0 + (amount), // width
    0.03333333 // height
  );
  vec2 gapSize = vec2(
    0.0, // width
    0.05 + 0.2 * amount // height
  );

  Square info = GetPlane(reader, planeSize, gapSize);
  // Sphere info = GetSphere(reader, planeSize);
  vec4 pos = info.vertex;
  // float xVal = info.xID / info.xSize;
  // float yVal = info.yID / info.ySize;

  bool shouldSkipRender = info.shouldSkipRender;

  // go crazy
  float pX = pos.x;
  float pY = pos.y;
  float pZ = pos.z;

  float piz = 0.01 * 2.0 * 3.14159265;

  // float sx = pattern(time + info.sphereIDX.xx);
  // float sy = pattern(time + info.sphereIDX.yy);
  // float sz = pattern(time + info.sphereIDX.zz);

  // default
//   pos.xyz = rotateZ(pX * piz) * pos.xyz;
//   pos.xyz = rotateQ(normalize(vec3(1.0, 1.0, 1.0)) * rotateZ(time + pY * piz), time + pY * piz) * pos.xyz;

  // infinity protection
  float myMode = 4.0;
  if (myMode == 1.0) {
    // infinity black hole
    pos.xyz = rotateY(pX * piz + amount) * pos.xyz;
    pos.xyz = rotateQ(normalize(vec3(1.0, 1.0, 1.0)), pX * piz + amount) * rotateX(pX * piz) * pos.xyz;
  } else if (myMode == 2.0) {
    // flat flower
    pos.xyz = rotateX(pX * piz + amount) * pos.xyz;
    pos.xyz = rotateY(pY * piz + amount) * pos.xyz;
  } else if (myMode == 3.0) {
    // rose voice tube
    pos.xyz = rotateX(pX * piz * sin(amount * 3.14159262)) * pos.xyz;
  } else if (myMode == 4.0) {
    // rose clean tube
    pos.xyz = rotateX(pX * piz + amount) * pos.xyz;
  } else if (myMode == 5.0) {
    // twister
    pos.xyz = rotateQ(normalize(vec3(1.0, 0.5, 0.2)), pX * piz + amount) * sin(amount * 3.14159265 * 1.0) * pos.xyz;
  } else if (myMode == 6.0) {
    // flower tube
    pos.xyz = rotateQ(normalize(vec3(1.0, 0.5, 0.2)), pX * piz * sin(amount * 3.14159265)) * pos.xyz;
  } else if (myMode == 7.0) {
    // flipper
    pos.xyz = rotateQ(normalize(vec3(1.0, 0.5, 0.2)), pX * piz * sin(amount * 3.14159265)) * pos.xyz;
    pos.xyz = rotateX(3.14159265 * 0.35) * pos.xyz;
    pos.xyz = rotateY(3.14159265 * 1.75) * pos.xyz;
  } else if (myMode == 8.0) {
    // ball ball sphere
    pos.x *= 0.6;
    pos.xyz = rotateQ(normalize(vec3(1.0, 1.0, 1.0)), time + pX * piz) * rotateZ(time + pY * piz) * pos.xyz;
  } else if (myMode == 9.0) {
    // dual spiral
    pos.x *= 0.6;
    pos.y *= 0.6;
    pos.xyz *= rotateQ(normalize(vec3(1.0, sin(time), 1.0)), time + pX * piz);
  } else if (myMode == 10.0) {
    pos.xyz *= rotateQ(normalize(vec3(1.0, sin(time), 1.0)), time + pX * piz) + pow(cos(amount * 0.5 * 3.14159265), 1.5);
  } else if (myMode == 11.0) {
    // simple ribbon
    pos.xyz = rotateX(pX * piz + amount) * pos.xyz;
    pos.xyz = rotateY(pX * piz + amount) * pos.xyz;
  } else if (myMode == 12.0) {
  }

  // simple ribbon


  /*

  */

//   pos.xyz = rotateQ(normalize(vec3(1.0, 0.0, 1.0)), amount * 3.0 + pZ * pY * piz * piz) * pos.xyz;

  // vortex

  //pos.z += sin(time  + pX * piz * 0.333) * 50.0;

  // pos.z += sin(time  + pX * piz * 0.333) * 50.0;

  // ------ STOP READING ME ------
  if (shouldSkipRender) {
    discard;
    return;
  } else {
    pos.w = 1.0;
    gl_FragColor = pos;
  }
}
