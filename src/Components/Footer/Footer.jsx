import './Footer.scss'

/** Bottom overlay bar that floats above the map and centers its content. */
export default function Footer({ children }) {
  return (
    <footer className="Footer">
      <div className="Footer-inner">{children}</div>
    </footer>
  )
}
