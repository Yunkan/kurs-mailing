const assert = require('assert');
const app = require('../app.js');
const Browser = require('zombie');
const browser = new Browser({ site: 'localhost:5000' });

describe('Mailing test', function() {
    it('Method validateEmail() should return true if write email', function() {
        assert.strictEqual(app.validateEmail('example@mail.ru'), true);
    });

    it('Method startMailing() should not return "Некорректные данные"', () => {
        const data = {
            to: 'example@mial.ru',
            subject: 'Test',
            text: 'Test text'
        }
        assert.notDeepStrictEqual(app.startMailing(data), 'Некорректные данные')
    });

    before( function(done ){
        browser.visit( '/', done );
    });

    it('Validating form', (done) => {
        browser.fill('to', 'example@mail.ru');
        browser.fill('subject', 'Test');
        browser.fill('text', 'Test tex');
        browser.pressButton('.btn').then(function() {
            assert.ok(browser.success);
        }).then(done, done);
    })
});