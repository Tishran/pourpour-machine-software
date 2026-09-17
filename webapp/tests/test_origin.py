"""Same-origin guard: the app is reachable over https behind the nginx proxy."""
import io
import unittest
from unittest.mock import Mock, patch

from server import Handler


def post(path, origin, host='coffee.wadymmmmm.ru', body=b'{"text":"Rwanda"}'):
    handler = Handler.__new__(Handler)
    handler.path = path
    headers = {'Content-Type': 'application/json', 'Content-Length': str(len(body)), 'Host': host}
    if origin:
        headers['Origin'] = origin
    handler.headers = headers
    handler.rfile = io.BytesIO(body)
    handler.connection = Mock()
    handler.send_json = Mock()
    handler.do_POST()
    return handler.send_json.call_args.args[0]


class OriginTests(unittest.TestCase):
    def test_https_origin_behind_a_tls_proxy_is_accepted(self):
        with patch('server.get_model') as model:
            model.return_value.recommend.return_value = {'kind': 'ok'}
            self.assertEqual(post('/api/recommend', 'https://coffee.wadymmmmm.ru'), 200)

    def test_http_origin_is_still_accepted(self):
        with patch('server.get_model') as model:
            model.return_value.recommend.return_value = {'kind': 'ok'}
            self.assertEqual(post('/api/recommend', 'http://coffee.wadymmmmm.ru'), 200)

    def test_no_origin_header_is_accepted(self):
        with patch('server.get_model') as model:
            model.return_value.recommend.return_value = {'kind': 'ok'}
            self.assertEqual(post('/api/recommend', None), 200)

    def test_other_sites_are_rejected(self):
        for origin in ['https://example.com', 'http://evil.test',
                       'https://coffee.wadymmmmm.ru.evil.test', 'null']:
            self.assertEqual(post('/api/recommend', origin), 403, origin)

    def test_machine_endpoint_uses_the_same_rule(self):
        self.assertEqual(post('/api/machine/start', 'https://example.com', body=b'{}'), 403)


if __name__ == '__main__':
    unittest.main()
