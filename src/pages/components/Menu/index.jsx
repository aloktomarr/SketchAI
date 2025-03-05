import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faEraser, faRotateLeft, faRotateRight, faFileArrowDown, faBroom } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/router';
import { socket } from '@/socket';
import styles from './index.module.css'
import { menuItemClick, actionItemClick } from '@/slice/menuSlice'
import { MENU_ITEMS } from '@/constants'

const Menu = () => {
    const router = useRouter();
    const { room } = router.query;
    const dispatch = useDispatch();
    const activeMenuItem = useSelector((state) => state.menu.activeMenuItem);
    const actionMenuItem = useSelector((state) => state.menu.actionMenuItem);

    const handleMenuClick = (itemName) => {
        dispatch(menuItemClick(itemName));
        // Broadcast menu item change to other users
        if (room) {
            socket.emit('menuItemChange', { room, menuItem: itemName });
        }
    };

    const handleActionItemClick = (itemName) => {
        console.log("Action clicked:", itemName);
        dispatch(actionItemClick(itemName));
        
        // No need to broadcast this as the Board component will handle the socket events
        // for specific actions like clear, undo, redo
    };

    return (
        <div className={styles.menuContainer}>
            <div 
                className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.PENCIL})} 
                onClick={() => handleMenuClick(MENU_ITEMS.PENCIL)}
                title="Pencil"
            >
                <FontAwesomeIcon icon={faPencil} className={styles.icon} />
            </div>
            <div 
                className={cx(styles.iconWrapper, {[styles.active]: activeMenuItem === MENU_ITEMS.ERASER})} 
                onClick={() => handleMenuClick(MENU_ITEMS.ERASER)}
                title="Eraser"
            >
                <FontAwesomeIcon icon={faEraser} className={styles.icon} />
            </div>
            <div 
                className={cx(styles.iconWrapper, {[styles.actionIcon]: true})}
                onClick={() => handleActionItemClick(MENU_ITEMS.ERASEALL)}
                title="Clear Canvas"
            >
                <FontAwesomeIcon icon={faBroom} className={styles.icon}/>
            </div>
            <div 
                className={cx(styles.iconWrapper, {[styles.actionIcon]: true})}
                onClick={() => handleActionItemClick(MENU_ITEMS.UNDO)}
                title="Undo"
            >
                <FontAwesomeIcon icon={faRotateLeft} className={styles.icon}/>
            </div>
            <div 
                className={cx(styles.iconWrapper, {[styles.actionIcon]: true})}
                onClick={() => handleActionItemClick(MENU_ITEMS.REDO)}
                title="Redo"
            >
                <FontAwesomeIcon icon={faRotateRight} className={styles.icon}/>
            </div>
            <div 
                className={cx(styles.iconWrapper, {[styles.actionIcon]: true})}
                onClick={() => handleActionItemClick(MENU_ITEMS.DOWNLOAD)}
                title="Download Image"
            >
                <FontAwesomeIcon icon={faFileArrowDown} className={styles.icon}/>
            </div>
        </div>
    );
};

export default Menu;