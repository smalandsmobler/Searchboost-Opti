"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const VERT = `attribute vec4 p;void main(){gl_Position=p;}`;

const FRAG = `precision mediump float;
uniform float uT;uniform vec2 uR;uniform float uH,uHA;
vec3 hsv(float h,float s,float v){
  vec3 c=abs(fract(h+vec3(1.,.667,.333))*6.-3.)-1.;
  return v*mix(vec3(1.),clamp(c,0.,1.),s);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),u.x),u.y);
}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/uR;
  float t=uT*.048,n=fbm(uv*4.2+t),b=sin(uT*.12)*.5+.5;
  float h=mix(uH/360.,uHA/360.,b)+n*.12-.06;
  gl_FragColor=vec4(hsv(h,.88,n*.55),1.);
}`;

export default function ShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pLoc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, "uT");
    const uR = gl.getUniformLocation(prog, "uR");
    const uH = gl.getUniformLocation(prog, "uH");
    const uHA = gl.getUniformLocation(prog, "uHA");

    let raf: number;
    let start = performance.now();

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    function render() {
      const t = (performance.now() - start) / 1000;
      gl!.uniform1f(uT, t);
      gl!.uniform2f(uR, canvas!.width, canvas!.height);
      gl!.uniform1f(uH, 328); // magenta
      gl!.uniform1f(uHA, 290); // deep purple
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4 }}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
