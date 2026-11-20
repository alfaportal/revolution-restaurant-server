# Ura e printerit — Arka

Ky program qëndron te kompjuteri i dyqanit. Çdo 2 sekonda pyet serverin. Kur ka kupon, e dërgon te printeri termik.

## 1. Plotëso config.json

Hape `config.json` me Notepad.

| Fusha | Çka shkruan |
|---|---|
| serverUrl | `https://revolution-pos.com` |
| slug | Kodi i lokalit. Te linku i arkës është pjesa pas `kafene/`. Shembull: linku `.../kafene/babylon/arka` → slug është `babylon` |
| apiKey | I njëjti kod që është te linku, pas `key=` |
| deviceId | Numri i arkës në shfletues: `WEB-ARKA-` dhe numri i punonjësit |
| printerName | Emri i printerit te Windows (si te «Pajisjet dhe printerët») |
| printerPort | Bosh nëse mjafton emri. Për rrjet shkruaj IP, p.sh. `192.168.1.50`. Për kabllo COM shkruaj `COM4` |
| pollInterval | `2000` (dy sekonda). Mos e ndrysho |

## 2. Nise

1. Kliko dy herë `setup.bat` (hera e parë).
2. Herët e tjera, te ky folder:

```
node bridge.js
```

Duhet të shohësh `Polling...`. Kur vjen kupon: `Job received`, pastaj `Printed OK`.

Lëre dritaren hapur. Nëse e mbyll, printeri nuk merr më kupona.

## 3. Nisja bashkë me Windows

**Folderi Startup**

1. Shtyp `Win + R`, shkruaj `shell:startup`, Enter.
2. Kliko me të djathtën → New → Shortcut.
3. Te vendndodhja shkruaj (ndërroje rrugën nëse folderi yt është gjetkë):

```
node C:\Users\1\Desktop\firmat\RESTAURANT\revolution-restaurant-server\print-bridge\bridge.js
```

4. Emri: `Ura e printerit`. Përfundo.
5. Rinis kompjuterin. Duhet të hapet një dritare e zezë me `Polling...`.

**Task Scheduler**

1. Hape Task Scheduler.
2. Create Basic Task → emri `Ura e printerit`.
3. Trigger: When I log on.
4. Action: Start a program.
5. Program: `node`
6. Arguments: rruga e plotë e `bridge.js`
7. Start in: folderi `print-bridge`
8. Përfundo.

## Printeri nuk printon

1. Te `config.json`, emri i printerit duhet të jetë i njëjtë me emrin te Windows.
2. Kontrollo kabllon USB, ose që IP e printerit është e saktë dhe printeri është ndezur.
3. Mbyll dritaren e urës dhe nise përsëri: `node bridge.js`
4. Nëse del `Print failed`, lexo rreshtin. `OpenPrinter failed` do të thotë emër i gabuar. `TCP timeout` do të thotë IP ose kabllja e rrjetit.
