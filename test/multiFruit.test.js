const assert = require('assert');
const Factory = require('../multiFruitFactory');

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://jaden:mypass@localhost:5432/fruitbasket';
// const connectionString = 'postgres://postgres@localhost/fruitbasket';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});

const factory = Factory(pool);

describe('Multi Fruit Basket testing:', () => {
    beforeEach(async () => {
        await pool.query('DELETE FROM fruit_basket_item');
        await pool.query('DELETE FROM multi_fruit_basket');

        await pool.query('ALTER SEQUENCE fruit_basket_item_id_seq RESTART WITH 1')
        await pool.query('ALTER SEQUENCE multi_fruit_basket_id_seq RESTART WITH 1')
    })

    it('Should create a new basket and item entry', async () => {
        await factory.createFruitBasket('Apple Sample', 'Apple', 2, 3);

        const appleBasket = await (await pool.query("SELECT * FROM multi_fruit_basket")).rows[0];
        const appleItem = await (await pool.query('SELECT * FROM fruit_basket_item')).rows[0];

        assert.equal(appleBasket.name, 'Apple Sample');

        assert.equal(appleItem.fruit_name, 'Apple');
        assert.equal(appleItem.qty, 2);
        assert.equal(appleItem.unit_price, 3);
    })

    it('Should not allow you to create a new basket if basket name already exists', async () => {
        await factory.createFruitBasket('Apple Sample', 'Apple', 2, 3);

        assert.equal(await factory.createFruitBasket('Apple Sample', 'Apple', 2, 3), false);
    })

    it('Should add an extra fruit item to given fruit basket', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

        const appleItem = await (await pool.query('SELECT * FROM fruit_basket_item')).rows;

        assert.equal(appleItem[1].fruit_name, 'Red Apple');
        assert.equal(appleItem[1].qty, 5);
        assert.equal(appleItem[1].unit_price, 3);
    })

    it('Should remove a given fruit item from the given basket', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

        await factory.removeFruitItem('Apples', 'Green Apple');

        const appleItem = await (await pool.query('SELECT * FROM fruit_basket_item')).rows;

        assert.equal(appleItem[0].fruit_name, 'Red Apple');
        assert.equal(appleItem[0].qty, 5);
        assert.equal(appleItem[0].unit_price, 3);
    })

    it('Should throw an error when given a non-existent item in a basket', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

        assert.equal(await factory.removeFruitItem('Apples', 'Blue Apple'), false);
    })

    it('Should delete the basket once the last item has been removed', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);

        await factory.removeFruitItem('Apples', 'Green Apple');
        const basket = await (await pool.query("SELECT * FROM multi_fruit_basket WHERE name='Apples'")).rows;
        assert.deepEqual(basket, []);
    })

    it('Should get basket details and fruits in said basket of given basket id', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        await factory.addFruitItem('Apples', 'Red Apple', 5, 3);
        
        const basket = await factory.getBasket(1);

        assert.equal(basket.id, 1);
        assert.equal(basket.name, 'Apples');

        assert.equal(basket.fruits[0].fruit_name, 'Green Apple');
        assert.equal(basket.fruits[0].qty, 2);
        assert.equal(basket.fruits[0].unit_price, 3);
        
        assert.equal(basket.fruits[1].fruit_name, 'Red Apple');
        assert.equal(basket.fruits[1].qty, 5);
        assert.equal(basket.fruits[1].unit_price, 3);
    })

    it('Should throw an error if given basket id does not belong to a basket in database', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        
        assert.equal(await factory.getBasket(2), false);
    })

    it('Should calculate the total price of a basket from the given basket name and id', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

        await factory.createFruitBasket('Pears', 'Big Pears', 5, 4);
        await factory.addFruitItem('Pears', 'Small Pears', 4, 3);
        await factory.addFruitItem('Pears', 'Medium Pears', 2, 5);

        assert.equal(await factory.calcBasketTotal('Apples', 1), 21);
    })

    it('Should calculate the total price of a basket from the given basket name and id', async () => {
        await factory.createFruitBasket('Apples', 'Green Apple', 2, 3);
        await factory.addFruitItem('Apples', 'Red Apple', 5, 3);

        await factory.createFruitBasket('Pears', 'Big Pears', 5, 4);
        await factory.addFruitItem('Pears', 'Small Pears', 4, 3);
        await factory.addFruitItem('Pears', 'Medium Pears', 2, 5);

        assert.equal(await factory.calcBasketTotal('Pears', 2), 42);
    })
})