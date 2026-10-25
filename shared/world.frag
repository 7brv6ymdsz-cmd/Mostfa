#version 300 es
precision highp float;
uniform vec2 uRes; uniform vec3 uRo, uTa, uOrbC; uniform float uWt, uStorm, uLight, uCover, uMoon, uRipT, uSat, uTime, uRoll, uWarm;
uniform vec4 uOrb; uniform vec2 uRipC;
out vec4 o;
const vec3 MOON = normalize(vec3(0.0, 0.30, 1.0));
const float CL = 15.0;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }

float waves(vec2 p){
  float s = uStorm, w = uWt, h = 0.;
  float w1 = 1. - abs(sin(dot(p, vec2(.24, .97)) * .26 + w * .9));
  float w2 = 1. - abs(sin(dot(p, vec2(-.7, .71)) * .43 + w * 1.25));
  h += s * (1.7 * pow(w1, 2.6) + .85 * pow(w2, 2.6) + .22 * sin(dot(p, vec2(.92, .38)) * .95 + w * 1.9) + .1 * sin(dot(p, vec2(-.2, .98)) * 1.8 + w * 2.6));
  h += (.035 + .2 * s) * (noise(p * 1.3 + vec2(w * .5, w * .3)) - .5);
  if (uRipT >= 0.){ float r = length(p - uRipC), k = r - uRipT * 2.6; h += .09 * exp(-k * k * .6) * sin(k * 6.) * exp(-uRipT * .3); }
  return h;
}
vec3 skyCol(vec3 rd){
  float y = max(rd.y, 0.);
  vec3 col = mix(vec3(.055, .095, .105), vec3(.008, .018, .024), pow(y, .45));
  vec3 q = rd * 330., id = floor(q); float st = h31(id); vec3 fq = fract(q) - .5;
  float tw = .6 + .4 * sin(uTime * 3. + st * 60.);
  col += vec3(1., .96, .88) * smoothstep(.14, .0, length(fq)) * step(.9965, st) * tw * (1. - min(uStorm, 1.)) * smoothstep(0., .08, rd.y);
  float md = dot(rd, MOON);
  float disc = smoothstep(.99952, .99962, md);
  vec2 mp = vec2(rd.x - MOON.x, rd.y - MOON.y) * 80.;
  vec3 mc = vec3(1., .96, .88) * (1.45 - .25 * fbm(mp * 1.3));
  float vis = 1. - .97 * min(uStorm, 1.);
  col = mix(col, mc * (.8 + .4 * uMoon), disc * vis);
  col += vec3(.95, .9, .8) * pow(max(md, 0.), 900.) * .9 * uMoon * vis + vec3(.45, .5, .5) * pow(max(md, 0.), 20.) * .07 * uMoon * vis;
  if (uStorm > .01){
    vec2 cp = rd.xz / (rd.y + .12) * 1.4 + vec2(uWt * .03, uWt * .05);
    float c = fbm(cp), cov = smoothstep(.25, .65, c) * min(uStorm, 1.);
    vec3 cc = mix(vec3(.025, .04, .045), vec3(.11, .13, .14), c) + uLight * vec3(.75, .8, 1.) * c * 1.4;
    col = mix(col, cc, cov * .96 * smoothstep(-.05, .12, rd.y));
    col += uLight * .12 * vec3(.7, .75, .95) * (1. - y);
  }
  return col;
}
vec3 orbGlow(vec3 ro, vec3 rd, float tmax){
  if (uOrb.w <= 0.) return vec3(0);
  vec3 oc = uOrb.xyz - ro; float t = max(dot(oc, rd), 0.); if (t > tmax) return vec3(0);
  float d = length(oc - rd * t);
  return uOrbC * uOrb.w * (.0016 / (d * d + .0004) + .06 * exp(-d * 1.2));
}
vec3 water(vec3 ro, vec3 rd, out float tt){
  tt = -1.;
  if (rd.y >= -.0005) return vec3(0);
  float maxH = 2.8 * uStorm + .25, t = max(0., (ro.y - maxH) / -rd.y);
  for (int i = 0; i < 56; i++){
    vec3 p = ro + rd * t; float d = p.y - waves(p.xz);
    if (d < .004 * t + .002){ tt = t; break; }
    t += max(.03, d * .55 / max(-rd.y, .08)); if (t > 600.){ break; }
  }
  if (tt < 0.) tt = t;
  vec3 p = ro + rd * tt; float e = .04 + tt * .003;
  vec3 n = normalize(vec3(waves(p.xz - vec2(e, 0)) - waves(p.xz + vec2(e, 0)), 2. * e, waves(p.xz - vec2(0, e)) - waves(p.xz + vec2(0, e))));
  n = normalize(mix(n, vec3(0, 1, 0), smoothstep(80., 500., tt)));
  vec3 r = reflect(rd, n); r.y = abs(r.y);
  float fres = .02 + .98 * pow(1. - max(dot(n, -rd), 0.), 5.);
  vec3 deep = vec3(.006, .022, .026) + uLight * vec3(.03, .035, .05);
  vec3 col = mix(deep, skyCol(r), fres) + orbGlow(p, r, 100.) * .8;
  col += uStorm * smoothstep(1.35, 2.2, p.y) * vec3(.2, .23, .25) * (.4 + fbm(p.xz * 1.7 + uWt));
  col += uLight * .08 * vec3(.6, .65, .85);
  vec3 hz = mix(vec3(.05, .085, .095), vec3(.09, .1, .11), uStorm) + uLight * vec3(.2, .22, .3);
  return mix(col, hz, 1. - exp(-tt * (.006 + .02 * uStorm)));
}
void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * uRes) / uRes.y;
  uv = mat2(cos(uRoll), -sin(uRoll), sin(uRoll), cos(uRoll)) * uv;
  vec3 ro = uRo, f = normalize(uTa - ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r);
  vec3 rd = normalize(f * 1.25 + uv.x * r + uv.y * u);
  vec3 col; float tw;
  if (ro.y > CL && rd.y < 0.){
    float tc = (ro.y - CL) / -rd.y; vec3 pc = ro + rd * tc;
    float d = fbm(pc.xz * .03 + vec2(uTime * .012, uTime * .02)) + .3 * fbm(pc.xz * .11 - uTime * .02);
    float dens = smoothstep(1.15 - uCover * 1.25, 1.4 - uCover * 1.25, d);
    vec2 fh = normalize(rd.xz + 1e-4), mh = normalize(MOON.xz);
    float k = pow(max(dot(fh, mh), 0.), 6.);
    vec3 cc = mix(vec3(.08, .1, .115), vec3(.5, .53, .55), smoothstep(.45, 1.1, d)) * (.55 + .9 * k);
    cc = mix(cc, vec3(.06, .095, .105), 1. - exp(-tc * .0045));
    vec3 below = water(ro, rd, tw);
    col = mix(below, cc, dens);
  } else {
    col = rd.y > 0. ? skyCol(rd) : water(ro, rd, tw);
  }
  col += orbGlow(ro, rd, 1e4);
  float fin = clamp(1. - abs(ro.y - (CL - 1.)) / 4.5, 0., 1.) * uCover;
  col = mix(col, vec3(.32, .36, .38) * (.7 + uLight), fin * .97);
  // the false calm of "smiling in front of everyone": warm, golden
  col = mix(col, col * vec3(1.45, 1.08, .68) + vec3(.045, .025, .0), uWarm * .75);
  float l = dot(col, vec3(.3, .59, .11));
  col = mix(col, vec3(l) * vec3(.85, .97, 1.1), uSat * .75);
  col = 1. - exp(-col * 2.2);
  o = vec4(pow(col, vec3(.82)), 1.);
}
