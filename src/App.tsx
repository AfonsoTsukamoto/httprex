import Theme from '@pages/main/theme';
import Layout from '@pages/main/layout';

function App() {
  return (
    <Theme>
      <Layout
        header="Hello"
        content="le content"
        sider="side stuff"
      />
    </Theme>
  )
}

export default App
