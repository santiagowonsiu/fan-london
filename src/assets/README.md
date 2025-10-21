# Assets Structure

## src/assets/images/
- Item product images
- Naming: item-name.jpg, item-name.png
- Example: aroyd-coconut-milk.jpg
- Import in components: import itemImg from "../assets/images/item-name.jpg"

## src/assets/icons/
- SVG icons for UI (edit, archive, add, etc.)
- Import: import EditIcon from "../assets/icons/edit.svg"

## src/assets/fonts/
- Custom fonts (if needed)
- Import in CSS: @font-face { src: url("./fonts/custom.woff2"); }

## public/images/
- Large static images, logos
- Access directly: /images/logo.png
- Good for images that don't need bundling

## Usage Examples

### Item Image Component
```jsx
function ItemRow({ item }) {
  const itemImg = require("../assets/images/" + item.name.toLowerCase().replace(/\s+/g, "-") + ".jpg");
  return (
    <div>
      <img src={itemImg} alt={item.name} />
      <span>{item.name}</span>
    </div>
  );
}
```

### Dynamic Image Loading
```jsx
function ItemImage({ itemName }) {
  const imagePath = "/images/" + itemName.toLowerCase().replace(/\s+/g, "-") + ".jpg";
  return <img src={imagePath} alt={itemName} />;
}
```
