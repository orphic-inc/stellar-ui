const PrivateFooter = () => (
  <div id="footer">
    <p>
      <a href="/private/">Home</a>
      {' · '}
      <a href="/private/forums">Forums</a>
      {' · '}
      <a href="/private/communities">Communities</a>
      {' · '}© {new Date().getFullYear()} Stellar
    </p>
  </div>
);

export default PrivateFooter;
