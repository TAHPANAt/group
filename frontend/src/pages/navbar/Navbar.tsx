import useEcomStore from '../../store/ecom-store';
import './navbar.css'
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const token = useEcomStore((state: any) => state.token)
  const hasShop = useEcomStore((state: any) => state.hasShop)
  const navigate = useNavigate();

  const handleClick = () => {
    if (hasShop) {
      navigate('/user/Profile');
    } else {
      navigate('/user/Create-profile');
    }
  };

  const handleLogout = () => {
    useEcomStore.getState().clearPersistedStore();
    navigate('/');
  };

  return (
    <div className="background-header">
      <div className="header-row">
        
        {/* ---- LEFT ---- */}
        <div className="header-left">
          <Link to="/product-list" className="no-border-button left-font-size-large">
            Seller Centre
          </Link>
          <span>|</span>

          {token && (
            <>
              <button
                onClick={handleClick}
                className="no-border-button left-font-size-large"
              >
                ShopProfile
              </button>
              <span>|</span>
            </>
          )} 

          <Link to="/Cart" className="no-border-button left-font-size-large">
            Cart
          </Link>
        </div>

        {/* ---- RIGHT ---- */}
        <div className="header-right">
          <Link to="/Messenger" className="no-border-button left-font-size-large">
            message
          </Link>

          {token && (
            <Link to="/CreateProfile" className="no-border-button left-font-size-large">
              My Profile
            </Link>
          )}

          {!token ? (
            <Link to="/login" className="no-border-button left-font-size-large header-far-right">
              Login/Register
            </Link>
          ) : (
            <button 
              onClick={handleLogout}
              className="no-border-button left-font-size-large header-far-right"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
