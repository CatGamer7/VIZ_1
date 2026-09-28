import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  'nav-link' + (isActive ? ' active fw-semibold' : '')

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom">
      <div className="container">
        <span className="navbar-brand mb-0">Social Media Explorer</span>
        <ul className="navbar-nav">
          <li className="nav-item">
            <NavLink to="/" end className={linkClass}>
              Explorer
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/normality" className={linkClass}>
              Normality
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/correlation" className={linkClass}>
              Correlation
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}
