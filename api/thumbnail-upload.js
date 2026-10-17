import { handleUpload } from '@vercel/blob/client';
import { getSession } from './_lib/auth.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  try {
    if (!getSession(req)) return res.status(401).json({error:'サムネイルをアップロードするにはログインしてください。'});
    let body=req.body; if(typeof body==='string') body=JSON.parse(body); if(!body||typeof body!=='object') body={};
    const result=await handleUpload({body,request:req,
      onBeforeGenerateToken:async (_pathname)=>({allowedContentTypes:['image/jpeg'],maximumSizeInBytes:500000,addRandomSuffix:true}),
      onUploadCompleted:async()=>{}
    });
    return res.status(200).json(result);
  } catch(e) { console.error('NowTube thumbnail upload error',e); return res.status(400).json({error:e.message||'サムネイルのアップロードに失敗しました。'}); }
}
