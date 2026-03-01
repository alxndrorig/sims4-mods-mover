import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    ('https://i.redd.it/i5o36yp5fiq51.jpg', 'public/bg1.jpg'),
    ('https://i.redd.it/zvag3d3mwbbg1.png', 'public/bg2.png'),
    ('https://i.redd.it/7aa5s85vm9431.jpg', 'public/bg3.jpg'),
    ('https://i.redd.it/ad22bre0rnb41.jpg', 'public/bg4.jpg')
]

for url, dest in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as response, open(dest, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Downloaded {dest}")
    except Exception as e:
        print(f"Failed {url}: {e}")
