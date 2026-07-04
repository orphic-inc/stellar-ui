import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { canUseTicketStaffActions } from '../staff/staffAffordances';
import TicketQueuePage from './TicketQueuePage';
import MyTicketsPage from './MyTicketsPage';

// Single Staff-PM entry point, dispatched by permission (mirrors the legacy
// staffpm dispatch): staff who can manage the inbox see the shared queue,
// everyone else sees their own member→staff conversations.
const StaffInboxPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  return canUseTicketStaffActions(currentUser) ? (
    <TicketQueuePage />
  ) : (
    <MyTicketsPage />
  );
};

export default StaffInboxPage;
