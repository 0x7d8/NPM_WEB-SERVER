import*as e from"fs";var c=(n,t)=>(t=t||[],e.readdirSync(n).forEach(o=>{if(e.statSync(n+"/"+o).isDirectory())t=c(n+"/"+o,t);else{let g=n+"/"+o;t.push(g)}}),t),i=(n,t,s)=>(s=s||[],s=c(n,s).filter(o=>o.endsWith(t)),s);export{c as getAllFiles,i as getAllFilesFilter};