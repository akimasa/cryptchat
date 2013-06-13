cryptchat
=========
http://gigazine.net/news/20130524-skype-backdoor-comfirmation/

なんやらSkypeもメッセージを第三者が閲覧できるらしいので、
エンドツーエンドで暗号化されて第三者にメッセージが閲覧されないようなチャットを作ってみた。

使い方
------
1. `npm install` & `node app.js`
2. http://127.0.0.1:3000/room/foo (fooは変更可能)
3. 適当なメールアドレスとパスワードを入力
4. loginを押す
5. マウスを適当に**動かす**
6. **5秒待って**適当なセッション鍵が生成されるのを待つ
7. http://127.0.0.1:3000/room/foo を違うタブで開く
8. 同様にログインする（先ほどとは異なるメールアドレスを使うことを推奨）
9. マウスを動かす
10. 違うタブに戻り、出てきたメッセージに**10秒以内**に「はい」と答える
11. 別のタブに切り替え、出てきたメッセージに「はい」と答える
12. 二つのタブ間での安全なチャットを楽しむ

Usage
-----
1. `npm install` & `node app.js`
2. Open http://127.0.0.1:3000/room/foo ("foo" can be changed)
3. Enter some email address and password.
4. Click login
5. *Move mouse* randomly to collect entropy. 
6. Wait **5 seconds** so session key will be created.
7. Open http://127.0.0.1:3000/room/foo in another tab.
8. Login(with another email address recommended)
9. Move mouse
10. Back to previous tab and say yes to dialog message with in **10 seconds**.
11. Go back to another tab and say yes to dialog message.
12. Enjoy secure chat between two tabs.
