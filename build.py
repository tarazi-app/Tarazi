#!/usr/bin/env python3
"""Сборка Tarazi: src/ -> dist/artifact.html (один файл) и www/ (сайт для iPhone и Android).

Использование:  python3 build.py          (версия dev)
                BUILD_VERSION=1.12 BUILD_DATE=2026-10-29 python3 build.py
"""
import os, re, shutil, subprocess, sys, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')


def read(*p):
    with open(os.path.join(*p), encoding='utf-8') as f:
        return f.read()


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def js_files():
    d = os.path.join(SRC, 'js')
    return sorted(n for n in os.listdir(d) if n.endswith('.js'))


def assemble():
    """Один HTML-файл: оболочка + стили + все js-модули по порядку имён."""
    shell = read(SRC, 'index.html')
    css = read(SRC, 'style.css')
    js = ''.join(read(SRC, 'js', n) for n in js_files())
    version = os.environ.get('BUILD_VERSION', 'dev')
    date = os.environ.get('BUILD_DATE', datetime.date.today().isoformat())
    js = js.replace('__BUILD_VERSION__', version).replace('__BUILD_DATE__', date)
    if os.environ.get('TARIZI_TEST'):
        hook = ("window.__t={S,tx,KK,carStats,shiftStats,parseNum,normTime,fmt,r2,docToXlsx,docToTxt,docToCsv,"
                "shiftDoc,carDoc,periodDoc,entityDoc,parseBackup,grossAnomaly,refGross,numOf,flushLocal,stampOf};\n")
        i = js.rindex('})();')
        js = js[:i] + hook + js[i:]
    return shell.replace('/*@STYLE@*/', css).replace('/*@SCRIPT@*/', js)


def main_script(html):
    a = html.index('<script>\n(function(){') + len('<script>\n')
    return html[a:html.index('</script>', a)]


def check_syntax(html, name):
    tmp = os.path.join(ROOT, '.check_' + name + '.js')
    write(tmp, main_script(html))
    try:
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        if r.returncode:
            print(r.stderr)
            sys.exit('Синтаксическая ошибка в сборке ' + name)
    finally:
        os.remove(tmp)


def web_version(html):
    """Версия для телефона и сайта: без внешних шрифтов, с PWA и нативным сохранением файлов."""
    html = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>\n?', '', html)
    head = ('<meta name="theme-color" content="#0F172A">\n'
            '<link rel="manifest" href="manifest.webmanifest">\n'
            '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-title" content="Tarazi">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
            '<script>window.__PWA=true;</script>\n')
    html = html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', head, 1)
    hooks = read(SRC, 'pwa', 'native_hook.js') + '\n' + read(SRC, 'pwa', 'pwa_hook.js')
    assert 'async function init(){' in html and '  S.downloads=dl;\n' in html
    html = html.replace('async function init(){', hooks + 'async function init(){', 1)
    html = html.replace('  S.downloads=dl;\n', '  S.downloads=dl||nativeDownloads()||webDownloads();\n', 1)
    reg = ('<script>\n'
           "if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())){\n"
           "  var had=!!navigator.serviceWorker.controller;\n"
           "  navigator.serviceWorker.addEventListener('controllerchange',function(){if(had&&window.__updateReady)window.__updateReady();});\n"
           "  addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});\n"
           '}\n</script>\n')
    i = html.rindex('</body>') if '</body>' in html else len(html)
    return html[:i] + reg + html[i:]


def main():
    version = os.environ.get('BUILD_VERSION', 'dev')
    art = assemble()
    check_syntax(art, 'artifact')
    write(os.path.join(ROOT, 'dist', 'artifact.html'), art)
    web = web_version(art)
    check_syntax(web, 'web')
    out = os.path.join(ROOT, 'www')
    shutil.rmtree(out, ignore_errors=True)
    write(os.path.join(out, 'index.html'), web)
    write(os.path.join(out, 'sw.js'), read(SRC, 'pwa', 'sw.js').replace('__BUILD_VERSION__', version))
    shutil.copy(os.path.join(SRC, 'pwa', 'manifest.webmanifest'), out)
    shutil.copytree(os.path.join(SRC, 'pwa', 'icons'), os.path.join(out, 'icons'))
    print('Готово: dist/artifact.html и www/ (версия %s)' % version)


if __name__ == '__main__':
    main()
