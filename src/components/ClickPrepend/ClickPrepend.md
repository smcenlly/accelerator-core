# ClickPrepend

A component that, when clicked, appends a new piece of content to itself.

## Example

```javascript
<ClickPrepend
  className="test"
  toAppend="I show up before the initial content."
>
  {/* children */}
  I show up on render.
</ClickPrepend>
```

## Property arguments

* `children (ReactNode)`: The content that will appear at render-time.
* `toAppend (ReactNode)`: The content which, after the user clicks the component, will be placed before the child content.
* `className (string, optional)`: An optional, extra class that will be passed on to the rendered container element.
