globalThis.self=globalThis;if(!globalThis.ProgressEvent)globalThis.ProgressEvent=class extends Event{constructor(t,o){super(t);Object.assign(this,o||{})}};
import * as THREE from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import fs from 'fs';
const f=process.argv[2];const g=await new Promise((res,rej)=>new GLTFLoader().parse(fs.readFileSync(f,'utf8'),'',res,rej));
const root=g.scene;root.updateMatrixWorld(true);const sk=[];root.traverse(o=>{if(o.isSkinnedMesh)sk.push(o)});
const bones=sk[0].skeleton.bones,inv=sk[0].skeleton.boneInverses;const p=v=>v.toArray().map(x=>x.toFixed(3)).join(',');
const W=new THREE.Matrix4().multiplyMatrices(bones[0].matrixWorld,inv[0]);
console.log('meshes',sk.length,'same skeleton',sk.every(s=>s.skeleton===sk[0].skeleton),'W pos',p(new THREE.Vector3().setFromMatrixPosition(W)));
for(const n of ['Hips','Head','WristR','WristL','FootL']){const i=bones.findIndex(b=>b.name===n);const b=bones[i];const B=new THREE.Matrix4().multiplyMatrices(b.matrixWorld,inv[i]);let d=0;for(let k=0;k<16;k++)d=Math.max(d,Math.abs(B.elements[k]-W.elements[k]));
 console.log(n,'world',p(new THREE.Vector3().setFromMatrixPosition(b.matrixWorld)),'dev(B-W)',d.toFixed(4))}
const s=sk[0];console.log('bindMatrix is I?',s.bindMatrix.equals(new THREE.Matrix4()),'mesh world pos',p(new THREE.Vector3().setFromMatrixPosition(s.matrixWorld)));
const pos=s.geometry.attributes.position;const bb=new THREE.Box3().setFromBufferAttribute(pos);console.log('raw bbox',p(bb.min),p(bb.max));
const bb2=bb.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(W,s.bindMatrix));console.log('rest bbox',p(bb2.min),p(bb2.max));
