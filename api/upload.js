import { handleUpload } from '@vercel/blob/client';
import { randomUUID } from 'node:crypto';
import { db, ensureSchema } from './_lib/db.js';
import { getSession } from './_lib/auth.js';
const MAX_FILE_SIZE=100*1024*1024;
const ALLOWED_TYPES=['video/mp4','video/webm','video/quicktime','video/x-m4v'];
export default async function handler(req,res) {
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
  try {
    let body=req.body;if(typeof body==='string')body=JSON.parse(body);if(!body||typeof body!=='object')body={};
    const result=await handleUpload({body,request:req,
      onBeforeGenerateToken:async (_pathname,clientPayload)=>{
        const user=getSession(req);if(!user)throw new Error('動画を投稿するにはログインしてください。');
        let details={};try{details=JSON.parse(clientPayload||'{}')}catch{}
        const title=String(details.title||'').trim().slice(0,100);
        const thumbnailUrl=String(details.thumbnailUrl||'');
        if(!title)throw new Error('動画タイトルを入力してください。');
        if(thumbnailUrl && (!thumbnailUrl.startsWith('https://') || !thumbnailUrl.includes('.blob.vercel-storage.com/'))) throw new Error('サムネイルURLが不正です。');
        return {allowedContentTypes:ALLOWED_TYPES,maximumSizeInBytes:MAX_FILE_SIZE,addRandomSuffix:true,
          tokenPayload:JSON.stringify({userId:user.id,uploader:user.username,title,description:String(details.description||'').trim().slice(0,1000),thumbnailUrl,duration:Number.isFinite(Number(details.duration))?Math.max(0,Number(details.duration)):null})};
      },
      onUploadCompleted:async({blob,tokenPayload})=>{
        let d={};try{d=JSON.parse(tokenPayload||'{}')}catch{}
        if(!d.userId||!d.uploader||!d.title)throw new Error('投稿情報が不足しています。');
        const sql=db();await ensureSchema(sql);
        await sql`INSERT INTO nowtube_videos (id,user_id,title,description,url,thumbnail_url,pathname,content_type,size,duration) VALUES (${randomUUID()},${d.userId},${d.title},${d.description||''},${blob.url},${d.thumbnailUrl||null},${blob.pathname},${blob.contentType||''},${blob.size||null},${d.duration==null?null:d.duration})`;
      }
    });
    return res.status(200).json(result);
  } catch(e) { console.error('NowTube upload error',e);return res.status(400).json({error:e.message||'アップロードに失敗しました。'}); }
}
