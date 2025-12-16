/**
 * @licstart The following is the entire license notice for the
 * JavaScript code in this page
 *
 * Copyright 2024 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * JavaScript code in this page
 */
/**
 * pdfjsVersion = 5.4.296
 * pdfjsBuild = f56dc8601
 */const e=!("object"!=typeof process||process+""!="[object process]"||process.versions.nw||process.versions.electron&&process.type&&"browser"!==process.type),t=[.001,0,0,.001,0,0],a=1.35,r=.35,i=.25925925925925924,n=1,s=2,o=4,c=8,l=16,h=64,u=128,d=256,f="pdfjs_internal_editor_",g=3,p=9,m=13,b=15,y=101,w={PRINT:4,MODIFY_CONTENTS:8,COPY:16,MODIFY_ANNOTATIONS:32,FILL_INTERACTIVE_FORMS:256,COPY_FOR_ACCESSIBILITY:512,ASSEMBLE:1024,PRINT_HIGH_QUALITY:2048},x=0,S=4,k=1,C=2,v=3,F={TEXT:1,LINK:2,FREETEXT:3,LINE:4,SQUARE:5,CIRCLE:6,POLYGON:7,POLYLINE:8,HIGHLIGHT:9,UNDERLINE:10,SQUIGGLY:11,STRIKEOUT:12,STAMP:13,CARET:14,INK:15,POPUP:16,FILEATTACHMENT:17,SOUND:18,MOVIE:19,WIDGET:20,SCREEN:21,PRINTERMARK:22,TRAPNET:23,WATERMARK:24,THREED:25,REDACT:26},T="Group",O="R",M=1,D=2,R=4,N=16,E=32,L=128,_=512,j=1,U=2,X=4096,q=8192,H=32768,W=65536,z=131072,$=1048576,G=2097152,V=8388608,K=16777216,J=1,Y=2,Z=3,Q=4,ee=5,te={E:"Mouse Enter",X:"Mouse Exit",D:"Mouse Down",U:"Mouse Up",Fo:"Focus",Bl:"Blur",PO:"PageOpen",PC:"PageClose",PV:"PageVisible",PI:"PageInvisible",K:"Keystroke",F:"Format",V:"Validate",C:"Calculate"},ae={WC:"WillClose",WS:"WillSave",DS:"DidSave",WP:"WillPrint",DP:"DidPrint"},re={O:"PageOpen",C:"PageClose"},ie=1,ne=5,se=1,oe=2,ce=3,le=4,he=5,ue=6,de=7,fe=8,ge=9,pe=10,me=11,be=12,ye=13,we=14,xe=15,Se=16,Ae=17,ke=18,Ce=19,ve=20,Fe=21,Ie=22,Te=23,Oe=24,Me=25,De=26,Be=27,Re=28,Ne=29,Ee=30,Pe=31,Le=32,_e=33,je=34,Ue=35,Xe=36,qe=37,He=38,We=39,ze=40,$e=41,Ge=42,Ve=43,Ke=44,Je=45,Ye=46,Ze=47,Qe=48,et=49,tt=50,at=51,rt=52,it=53,nt=54,st=55,ot=56,ct=57,lt=58,ht=59,ut=60,dt=61,ft=62,gt=63,pt=64,mt=65,bt=66,yt=67,wt=68,xt=69,St=70,At=71,kt=72,Ct=73,vt=74,Ft=75,It=76,Tt=77,Ot=80,Mt=81,Dt=83,Bt=84,Rt=85,Nt=86,Et=87,Pt=88,Lt=89,_t=90,jt=91,Ut=92,Xt=93,qt=94,Ht=0,Wt=1,zt=2,$t=3,Gt=1,Vt=2;let Kt=ie;function getVerbosityLevel(){return Kt}function info(e){Kt>=ne&&console.info(`Info: ${e}`)}function warn(e){Kt>=ie&&console.warn(`Warning: ${e}`)}function unreachable(e){throw new Error(e)}funct...
/*webpackIgnore: true*/
/*@vite-ignore*/
t)).default()}catch(e){warn(`JpxImage#getJsModule: ${e}`)}e(a)}static async#U(e,t,a){const r="openjpeg.wasm";try{this.#E||(this.#_?this.#E=await fetchBinaryData(`${this.#F}${r}`):this.#E=await this.#P.sendWithPromise("FetchBinaryData",{type:"wasmFactory",filename:r}));return a((await WebAssembly.instantiate(this.#E,t)).instance)}catch(t){warn(`JpxImage#instantiateWasm: ${t}`);this.#j(e);return null}finally{this.#P=null}}static async decode(e,{numComponents:t=4,isIndexedColormap:a=!1,smaskInData:r=!1,reducePower:i=0}={}){if(!this.#L){const{promise:e,resolve:t}=Promise.withResolvers(),a=[e];this.#v?a.push(Ma({warn,instantiateWasm:this.#U.bind(this,t)})):this.#j(t);this.#L=Promise.race(a)}const n=await this.#L;if(!n)throw new JpxError("OpenJPEG failed to initialize");let s;try{const o=e.length;s=n._malloc(o);n.writeArrayToMemory(e,s);if(n._jp2_decode(s,o,t>0?t:0,!!a,!!r,i)){const{errorMessages:e}=n;if(e){delete n.errorMessages;throw new JpxError(e)}throw new JpxError("Unknown error")}const{imageData:c}=n;n.imageData=null;return c}finally{s&&n._free(s)}}static cleanup(){this.#L=null}static parseImageProperties(e){let t=e.getByte();for(;t>=0;){const a=t;t=e.getByte();if(65361===(a<<8|t)){e.skip(4);const t=e.getInt32()>>>0,a=e.getInt32()>>>0,r=e.getInt32()>>>0,i=e.getInt32()>>>0;e.skip(16);return{width:t-r,height:a-i,bitsPerComponent:8,componentsCount:e.getUint16()}}}throw new JpxError("No size marker found in JPX stream")}}function addState(e,t,a,r,i){let n=e;for(let e=0,a=t.length-1;e<a;e++){const a=t[e];n=n[a]||=[]}n[t.at(-1)]={checkFn:a,iterateFn:r,processFn:i}}const Da=[];addState(Da,[pe,be,Nt,me],null,function iterateInlineImageGroup(e,t){const a=e.fnArray,r=(t-(e.iCurr-3))%4;switch(r){case 0:return a[t]===pe;case 1:return a[t]===be;case 2:return a[t]===Nt;case 3:return a[t]===me}throw new Error(`iterateInlineImageGroup - invalid pos: ${r}`)},function foundInlineImageGroup(e,t){const a=e.fnArray,r=e.argsArray,i=e.iCurr,n=i-3,s=i-2,o=i-1,c=Math.min(Math.floor((t-n)/4...