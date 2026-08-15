# Overlay Themes

Theme layout components are presentation-only. They can compose shared overlay
components and read state from Angular inputs/signals, but they must not call
socket, API, storage, or DOM services directly.

Each theme owns its profile and playing layout components. Cyberpunk and Sunset
can reuse shared microcomponents, but their layout templates should stay
independent so either theme can change composition without touching data
services or the other theme.

Shared microcomponents live outside `themes/` and expose stable overlay pieces:
song cover, song identity, song meta, map ratings, PP predictor, profile avatar,
profile name, profile ranks, and profile next-rank rows.
