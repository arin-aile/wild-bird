"""Local static preview and general Korean → English translation proxy."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse, html, json, ssl, urllib.request, urllib.parse, webbrowser
ROOT = Path(__file__).resolve().parent
CACHE = {}
TLS = ssl.create_default_context(cafile='/etc/ssl/cert.pem') if Path('/etc/ssl/cert.pem').exists() else ssl.create_default_context()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args): pass
    def do_POST(self):
        if self.path != '/api/translate': return self.reply(404,{'error':'Not found'})
        origin=self.headers.get('Origin','')
        if origin and urllib.parse.urlparse(origin).netloc != self.headers.get('Host'): return self.reply(403,{'error':'Invalid origin'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 4096: raise ValueError()
            word=json.loads(self.rfile.read(length)).get('text','').strip()
            if not word or len(word.encode('utf-8'))>500: return self.reply(400,{'error':'꿈은 120자 이내로 적어 주세요.'})
            if word in CACHE: return self.reply(200,{'translation':CACHE[word]})
            # English is already in the requested target language.
            if word.isascii() and any(c.isalpha() for c in word): result=word
            else:
                query=urllib.parse.urlencode({'q':word,'langpair':'ko|en'})
                request=urllib.request.Request('https://api.mymemory.translated.net/get?'+query,headers={'User-Agent':'WildBirdPrototype/1.0'})
                with urllib.request.urlopen(request,timeout=20,context=TLS) as response: data=json.load(response)
                if int(data.get('responseStatus',0))!=200 or data.get('quotaFinished'): raise RuntimeError('quota')
                result=html.unescape(data.get('responseData',{}).get('translatedText','')).strip()
                if not result: raise RuntimeError('empty')
            CACHE[word]=result
            self.reply(200,{'translation':result})
        except (ValueError,TypeError,AttributeError): self.reply(400,{'error':'입력 내용을 확인해 주세요.'})
        except Exception: self.reply(502,{'error':'번역 서비스에 연결하지 못했어요. 인터넷 연결을 확인하거나 잠시 후 다시 눌러 주세요.'})
    def reply(self,status,data):
        body=json.dumps(data,ensure_ascii=False).encode(); self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=0);parser.add_argument('--no-open',action='store_true');args=parser.parse_args()
    with ThreadingHTTPServer(('127.0.0.1',args.port),Handler) as server:
        url=f'http://127.0.0.1:{server.server_port}';print('Wild Bird:',url,'\n이 창을 열어 두세요. 종료: Control+C',flush=True)
        if not args.no_open:webbrowser.open(url)
        try:server.serve_forever()
        except KeyboardInterrupt:pass
