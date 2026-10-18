(() => {
  const cfg = window.WARIS_CONFIG || {};
  const $ = id => document.getElementById(id);
  const loginPanel = $('login-panel'), dashboard = $('dashboard');
  let client = null, songs = [];
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('YOUR_PROJECT') && window.supabase?.createClient;
  if (configured) client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  else { $('login-message').textContent = 'Setup required: copy config.js.example to config.js and add your Supabase project values.'; $('login-message').classList.add('error'); }

  function message(id, text, error=false) { const el=$(id); el.textContent=text; el.classList.toggle('error',error); }
  function setBusy(busy) { $('save-song').disabled=busy; $('save-song').textContent=busy?'Saving…':'Upload & publish ↗'; }
  function safeName(name) { return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-100) || 'file'; }
  function showDashboard() { loginPanel.hidden=true; dashboard.hidden=false; refreshSongs(); }
  async function checkSession() {
    if (!client) return;
    const {data:{session}} = await client.auth.getSession();
    if (session) {
      const email = session.user?.email?.toLowerCase();
      if (email !== (cfg.ADMIN_EMAIL||'').toLowerCase()) { await client.auth.signOut(); message('login-message','This account is not authorized as the site admin.',true); return; }
      showDashboard();
    }
  }
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault(); if(!client) return;
    const username=$('username').value.trim(), password=$('password').value;
    if(username !== cfg.ADMIN_USERNAME) { message('login-message','Incorrect admin username or password.',true); return; }
    message('login-message','Signing in…');
    const {error}=await client.auth.signInWithPassword({email:cfg.ADMIN_EMAIL,password});
    if(error) { message('login-message','Login failed. Check credentials and confirm your Supabase admin user is set up.',true); return; }
    const {data:{user}}=await client.auth.getUser();
    if(user?.email?.toLowerCase() !== (cfg.ADMIN_EMAIL||'').toLowerCase()) { await client.auth.signOut(); message('login-message','This account is not authorized.',true); return; }
    message('login-message',''); showDashboard();
  });
  $('logout').addEventListener('click',async()=>{if(client) await client.auth.signOut(); dashboard.hidden=true;loginPanel.hidden=false;$('password').value='';message('login-message','You have signed out.');});
  $('refresh').addEventListener('click',refreshSongs);
  $('cancel-edit').addEventListener('click',resetForm);

  async function refreshSongs() {
    if(!client) return;
    $('song-list').innerHTML='<p class="muted">Loading songs…</p>';
    const {data,error}=await client.from('songs').select('*').order('track_no',{ascending:true});
    if(error){$('song-list').innerHTML='';message('song-message','Could not load songs: '+error.message,true);return;}
    songs=data||[]; $('song-count').textContent=songs.length; renderSongs();
  }
  function renderSongs() {
    const list=$('song-list'); list.innerHTML='';
    if(!songs.length){list.innerHTML='<p class="muted">No online songs yet. Add your first track using the form.</p>';return;}
    songs.forEach(song=>{
      const row=document.createElement('article');row.className='song-row';
      const img=document.createElement('img');img.src=song.cover_url;img.alt='';img.loading='lazy';
      const info=document.createElement('div');info.className='song-info';
      const title=document.createElement('strong');title.textContent=`${song.track_no}. ${song.title}`;
      const meta=document.createElement('span');meta.textContent=`${song.artist||'Unknown artist'} · ${song.published?'Published':'Draft'}`;meta.className=song.published?'published':'unpublished';
      info.append(title,meta);
      const actions=document.createElement('div');actions.className='song-actions';
      const edit=document.createElement('button');edit.className='ghost';edit.textContent='Edit';edit.addEventListener('click',()=>editSong(song));
      const toggle=document.createElement('button');toggle.className='ghost';toggle.textContent=song.published?'Unpublish':'Publish';toggle.addEventListener('click',()=>togglePublished(song));
      const del=document.createElement('button');del.className='ghost delete';del.textContent='Delete';del.addEventListener('click',()=>deleteSong(song));
      actions.append(edit,toggle,del);row.append(img,info,actions);list.append(row);
    });
  }
  function editSong(song) {
    $('song-id').value=song.id;$('title').value=song.title;$('artist').value=song.artist||'';$('album').value=song.album||'';$('track-no').value=song.track_no;$('published').checked=!!song.published;
    $('audio-file').required=false;$('cover-file').required=false;$('form-heading').textContent='Edit song';$('save-song').textContent='Save changes ↗';$('cancel-edit').hidden=false;message('song-message','Leave file fields empty to keep existing media.');window.scrollTo({top:0,behavior:'smooth'});
  }
  function resetForm(){ $('song-form').reset();$('song-id').value='';$('track-no').value=Math.max(1,...songs.map(s=>Number(s.track_no)||0))+1;$('published').checked=true;$('audio-file').required=false;$('cover-file').required=false;$('form-heading').textContent='Add a song';$('save-song').textContent='Upload & publish ↗';$('cancel-edit').hidden=true;message('song-message',''); }
  async function upload(file,folder) {
    const path=`${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const {data,error}=await client.storage.from('waris-media').upload(path,file,{upsert:false,contentType:file.type||undefined,cacheControl:'31536000'});
    if(error) throw error;
    const {data:{publicUrl}}=client.storage.from('waris-media').getPublicUrl(data.path);
    return publicUrl;
  }
  $('song-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!client)return;
    setBusy(true);message('song-message','Saving your song…');
    try {
      const id=$('song-id').value, old=songs.find(s=>s.id===id);
      const audioFile=$('audio-file').files[0],coverFile=$('cover-file').files[0];
      if(!old&&(!audioFile||!coverFile)) throw new Error('Choose both an audio file and album artwork for a new song.');
      if(audioFile && audioFile.size>50*1024*1024) throw new Error('Audio file exceeds 50 MB. Increase your project upload limit or use a smaller file.');
      if(coverFile && coverFile.size>8*1024*1024) throw new Error('Album artwork must be 8 MB or smaller.');
      const audioUrl=audioFile?await upload(audioFile,'audio'):old.audio_url;
      const coverUrl=coverFile?await upload(coverFile,'covers'):old.cover_url;
      const row={title:$('title').value.trim(),artist:$('artist').value.trim(),album:$('album').value.trim(),track_no:Number($('track-no').value),audio_url:audioUrl,cover_url:coverUrl,published:$('published').checked,updated_at:new Date().toISOString()};
      const result=old?await client.from('songs').update(row).eq('id',id):await client.from('songs').insert(row);
      if(result.error) throw result.error;
      message('song-message','Saved successfully. The main playlist will show published songs on refresh.');resetForm();await refreshSongs();
    } catch(err) { message('song-message',err.message||'Could not save song.',true); }
    finally {setBusy(false);}
  });
  async function togglePublished(song){const {error}=await client.from('songs').update({published:!song.published,updated_at:new Date().toISOString()}).eq('id',song.id);if(error)message('song-message',error.message,true);else{message('song-message',song.published?'Song unpublished.':'Song published.');refreshSongs();}}
  async function deleteSong(song){if(!confirm(`Delete “${song.title}” from the online playlist? This cannot be undone.`))return;const {error}=await client.from('songs').delete().eq('id',song.id);if(error)message('song-message',error.message,true);else{message('song-message','Song deleted from the online playlist.');refreshSongs();}}
  $('track-no').value=1;checkSession();
})();
