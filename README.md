# CoCode

Realtime collaborative HTML editing with live previews. Create a new document using the input box in the header after `cocode:`

https://shitchell.github.io/cocode/

## Uses

* Useful for live previews of your HTML as you edit
* Realtime collaboration is useful for tutoring or otherwise helping someone with HTML.
* The mobile interface defaults to a fullscreen preview of the webpage, which (combined with the realtime collaboration aspect) means you can edit from your desktop and view the updates in realtime on your mobile device. This is incredibly handy to see immediately how changes will appear on mobile.

Eventually I'd like to implement multiple files and then ultimately link CoCode with GitHub such that users can collaborate on entire projects together in realtime. Maybe. The only real advantage of this over [repl.it](https://replit.com/) is the minimal simplicity with no account necessary to save your work and the realtime updates. Live execution of code won't necessarily transfer as well to something like python, I don't think? Perhaps for simple hello world scripts, which *is* the target use (to assist in teaching others basic concepts).  
**tldr** *this will probably evolve, but i'm not totally sure how and what efforts will be worth the time in a world where repl.it already exists*

## TODO

- [x] user list
- [ ] chat
- [x] use html title in window title
- [x] use html favicon as window favicon
- [ ] multiple files
- [ ] drag to resize editor/preview
- [ ] settings
  - [ ] ace/codemirror
  - [ ] update
    - [ ] live
    - [ ] after X seconds of no typing
    - [ ] on build
  - [ ] language (py/html)
- [ ] `localStorage` history
- [ ] python-in-browser support for collaborative python scripts
