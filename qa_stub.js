// Stub DOM minimale per test headless del simulatore.
global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.dispatchEvent = () => {};
const _mkEl = () => ({
  innerHTML: '', value: '', textContent: '', style: {}, classList: { toggle(){}, add(){}, remove(){}, contains(){return false;} },
  dataset: {}, appendChild(){}, addEventListener(){}, removeEventListener(){}, querySelectorAll: () => [], querySelector: () => null, closest: () => null,
  insertAdjacentElement(){ return _mkEl(); }, insertAdjacentHTML(){}, parentElement: null, parentNode: null, nextSibling: null, offsetParent: null,
  setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){}, focus(){}, blur(){}, click(){},
  getContext: () => ({ font:'', fillStyle:'', strokeStyle:'', lineWidth:1, textAlign:'', textBaseline:'', globalAlpha:1, clearRect(){}, save(){}, restore(){}, beginPath(){}, moveTo(){}, lineTo(){}, stroke(){}, fill(){}, fillText(){}, arc(){}, fillRect(){}, strokeRect(){}, setLineDash(){}, measureText: () => ({width:0}), createLinearGradient: () => ({addColorStop(){}}), scale(){}, translate(){}, rotate(){} }),
});
global.document = {
  getElementById: (id) => _mkEl(),
  querySelectorAll: () => [], querySelector: () => _mkEl(), addEventListener(){}, createElement: () => _mkEl(),
  body: { appendChild(){}, classList: { add(){}, remove(){}, toggle(){} } },
  head: { appendChild(){}, insertBefore(){} },
  documentElement: { style:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}} },
};
global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
global.location = { hash: '', href: '', search: '', pathname: '/' };
global.history = { pushState(){}, replaceState(){} };
global.navigator = { userAgent: 'node' };
global.Chart = function(){ return { destroy(){}, update(){}, data:{datasets:[]}, options:{} }; };
global.Chart.register = () => {};
global.Chart.defaults = { plugins: { legend: { labels: {} }, tooltip: {} }, font: {}, scale: {}, scales:{}, elements: { line:{}, point:{}, arc:{}, bar:{} } };
global.requestAnimationFrame = (fn) => fn();
global.fetch = () => Promise.reject(new Error('no network in test'));
global.alert = () => {};
global.confirm = () => true;
global.performance = { now: () => Date.now() };
