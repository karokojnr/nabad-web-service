const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = require('chai').expect;

const app = require('../nadab');
const Hotel = require('../src/models/Hotel');
chai.use(chaiHttp);

describe('Nadab core test', function() {

  beforeEach((done) => {
    Hotel.deleteMany({}).then(()=>{
      done();
    });
  });

  // afterEach((done)=> {
  //   done();
  // });

  it('hotels collection should be empty', (done) => {
    chai.request(app)
      .get('/hotels')
      .end((error, res) => {
        expect(error).to.equal(null);
        expect(res.status).to.equal(200);
        expect(res.body.hotels).to.have.lengthOf(0);
        done();
      });
  });

  it('/register should add a hotel', (done) => {
    let hotel = {
      paymentStatus: "UNPAID",
      city: "Nairobi",
      address: "64",
      payBillNo: "235678",
      businessName: "Place Poa",
      mobileNumber: "706352266",
      applicantName: "Jane Doe",
      businessEmail: "placepoa@gmail.com",
      password: "password"
    };
    chai.request(app)
      .post('/register')
      .send(hotel)
      .end((error, res) => {
        expect(error).to.equal(null);
        expect(res.status).to.equal(200);
        expect(res.body.hotel.paymentStatus).to.equals('UNPAID', 'Payment status should be UNPAID');
        expect(res.body.hotel.password).not.to.equal(hotel.password, 'Password must be hashed');
        expect(res.body.success).to.equal(true);
        done();
      });
  });
});
