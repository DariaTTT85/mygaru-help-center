const ts=require('typescript'),fs=require('node:fs'),assert=require('node:assert/strict');
process.env.NOTION_TOKEN='test';process.env.NOTION_DATABASE_ID='test';
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(fs.readFileSync('lib/notion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(require,mod,mod.exports);
const page=(id,category)=>({id,properties:{Title:{title:[{plain_text:id}]},Category:{select:{name:category}},Slug:{rich_text:[{plain_text:id}]}}});
const requests=[];
global.fetch=async(url,options)=>{const body=JSON.parse(options.body);requests.push(options.body);return {ok:true,json:async()=>body.start_cursor?{results:[page('integration','Integrations Guide')],has_more:false}:{results:[page('cookie-policy',' Legal documents ')],has_more:true,next_cursor:'next'}}};
(async()=>{const all=await mod.exports.getArticles();const legal=await mod.exports.getArticles({category:'Legal Documents'});assert.equal(all.length,2);assert.deepEqual(legal,all.filter(a=>a.category==='Legal Documents'));assert.equal(legal[0].slug,'cookie-policy');assert.deepEqual(requests.slice(0,2),requests.slice(2,4));global.fetch=async()=>({ok:false});await assert.rejects(mod.exports.getArticles({category:'Legal Documents'}));console.log('PASS: shared query, category normalization, pagination, error instead of empty list.');})().catch(e=>{console.error(e);process.exitCode=1});
