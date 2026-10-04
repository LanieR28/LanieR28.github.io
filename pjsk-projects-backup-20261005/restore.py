from pathlib import Path
import json,hashlib,zipfile
base=Path(__file__).parent
for info in sorted(base.glob('*.parts.json')):
    out=base/(info.name.replace('.parts.json','') if '.bundle.' in info.name else info.name.replace('.parts.json','.zip'))
    with out.open('wb') as f:
        for part in json.loads(info.read_text()):
            data=(base/part['name']).read_bytes()
            assert hashlib.sha256(data).hexdigest()==part['sha256'],part['name']
            f.write(data)
    if out.suffix == '.bundle': continue
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        z.extractall(base/'restored')
print('Restored to',base/'restored')

