import { Link } from 'react-router-dom';

interface SectionLink {
  label: string;
  to: string;
}
interface SectionProps {
  title: string;
  links: SectionLink[];
}

const Section = ({ title, links }: SectionProps) => (
  <div className="permission_subcontainer">
    <table className="layout">
      <thead>
        <tr className="colhead">
          <td>{title}</td>
        </tr>
      </thead>
      <tbody>
        {links.map(({ label, to }) => (
          <tr key={label}>
            <td>
              <Link to={to}>{label}</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Toolbox = () => (
  <div className="thin">
    <h2>Staff Toolbox</h2>
    <div className="permissions">
      <div className="permission_container">
        <Section
          title="Administration"
          links={[
            {
              label: 'Permissions manager',
              to: '/private/staff/tools/permissions'
            }
          ]}
        />
        <Section
          title="Community"
          links={[
            {
              label: 'Category manager',
              to: '/private/staff/tools/categories'
            },
            { label: 'Forum manager', to: '/private/staff/tools/forums' }
          ]}
        />
      </div>
      <div className="permission_container">
        <Section
          title="User management"
          links={[
            { label: 'Create user', to: '/private/staff/tools/user/new' }
          ]}
        />
      </div>
    </div>
  </div>
);

export default Toolbox;
