const ts = require('typescript');
const fs = require('node:fs');
const assert = require('node:assert/strict');
function load(file) {
 const mod = {exports:{}};
 new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(require,mod,mod.exports);
 return mod.exports;
}
const {splitSections,sectionHref}=load('lib/sections.ts');
const para={id:'p',type:'paragraph',paragraph:{rich_text:[{plain_text:'Intro'}]}};
const h=(id,title,type='heading_1')=>({id,type,[type]:{rich_text:[{plain_text:title}]}});
const nested={id:'toggle',type:'toggle',has_children:true,children:[h('nested','Nested')]};
let sections=splitSections([para,h('a-b','Overview'),h('sub','Sub','heading_2'),nested,h('c-d','Overview')]);
assert.deepEqual(sections.map(s=>s.id),['introduction','ab','cd']);
assert.equal(sections[1].blocks.length,3);
assert.equal(sections[1].blocks[2],nested);
assert.equal(splitSections([h('a-b','Renamed')])[0].id,'ab');
assert.deepEqual(splitSections([]),[]);
assert.deepEqual(splitSections([para])[0].blocks,[para]);
assert.equal(splitSections([h('a','One'),h('b','Two')]).length,2);
assert.equal(sectionHref('guide','ab'),'/articles/guide?section=ab');
process.env.NOTION_TOKEN='test-token';
const calls=[];
global.fetch=async(url,options)=>{
 calls.push({url,options});
 return {ok:true,json:async()=>url.includes('start_cursor')?{results:[h('b','Two')],has_more:false}:{results:[para],has_more:true,next_cursor:'next'}};
};
const notion=load('lib/notion.ts');
(async()=>{
 assert.equal((await notion.getChildBlocks('doc')).length,2);
 assert.equal(calls[0].options.next.revalidate,300);
 calls.length=0;
 global.fetch=async(url)=>{calls.push(url);return {ok:true,json:async()=>({results:[para],has_more:false})}};
 await notion.expandBlocks([{id:'selected',has_children:true},{id:'plain',has_children:false}]);
 assert.equal(calls.length,1);
 assert.ok(calls[0].includes('/selected/children'));
 global.fetch=async()=>({ok:false});
 await assert.rejects(notion.getChildBlocks('failed'));
 console.log('PASS: introduction, H1 boundaries, nested/H2 preservation, duplicate and renamed headings, empty documents, pagination, cache, selected-only children, errors.');
})().catch(e=>{console.error(e);process.exitCode=1});
