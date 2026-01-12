import Theme from '@pages/main/theme';
import Layout from '@pages/main/layout';
import Request from '@src/components/Request';
import { Col, Divider, Row } from 'antd';
import { RequestMethod } from '@src/constants';
const requests = [
  {
    method: RequestMethod.GET,
    url: "https://google.com"
  },
  {
    method: RequestMethod.PUT,
    url: "https://anapp.com/123",
    body: { "email": "foo@gmail.com" }
  },
  {
    method: RequestMethod.POST,
    url: "https://anapp.com",
    body: { "email": "foo@gmail.com" }
  }
]

function App() {
  return (
    <Theme>
      <Layout
        header="Hello"
        content={
          requests.map(({ method, url, body }) => (
            <>
              <Row>
                <Col flex={2}>
                  <Request method={method} url={url} body={body} />
                </Col>
                <Col flex={1}></Col>
              </Row>
              <Divider/>
            </>
          ))
        }
        sider="side stuff"
      />
    </Theme>
  )
}

export default App
