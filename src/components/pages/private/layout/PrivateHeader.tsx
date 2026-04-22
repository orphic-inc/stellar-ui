import { Link } from 'react-router-dom';
import UserMenu from '../../../layout/UserMenu';
import Alert from '../../../layout/Alert';
import ModBar from '../../../admin/ModBar';
import type { AuthUser } from '../../../../types';

interface Props {
  user: AuthUser;
}

const PrivateHeader = ({ user }: Props) => (
  <>
    <div id="logo">
      <Link to="/private/">Stellar</Link>
    </div>
    <div id="wrapper">
      <div id="header">
        <UserMenu user={user} />
        <Alert />
        <ModBar />
      </div>
    </div>
  </>
);

export default PrivateHeader;
