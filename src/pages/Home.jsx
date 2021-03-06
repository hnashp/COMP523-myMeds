import React, { useState } from 'react';
import {db} from '../firebase'
import { useAuth } from "../contexts/AuthContext"
import { useHistory } from "react-router-dom"
import '../css/Home.css';
import { Form, Button, Col, Alert, CardDeck} from "react-bootstrap"
import NavbarContainer from '../components/NavbarContainer'
import MedCard from '../components/MedCard'
import { v4 as uuidv4 } from 'uuid';
import RequestForm from '../components/RequestForm'
import Footer from '../components/Footer'
import HowItWorks from '../components/HowItWorks'
import { titleCase } from '../helpers/formatting.jsx';
import { ReactComponent as CapsuleIcon } from '../img/capsule.svg';

const Home = () => {
    const [query, setQuery] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [resultsArray, setResultsArray] = useState([]);
    const [sortBy, setSortBy] = useState("");
    
    const history = useHistory()
    const {currentUser} = useAuth();

    const getData = async () => {
      // searches through docs for query match in 'genericName' first. If no matches, searches for query match in 'brandNames' next, and so on.
      if (query !== "" ) {
        let querySnapshot = await db.collection("drug").where("genericName", '==', titleCase(query)).get();
        if (querySnapshot.empty) {
          querySnapshot = await db.collection("drug").where("brandName", '==', titleCase(query)).get()
          if (querySnapshot.empty) {
            querySnapshot = await db.collection("drug").where("indicationArray", 'array-contains', titleCase(query)).get()
            if (querySnapshot.empty) {
              setAlertMessage("No matching medications found!")
              return;
            }
          }
        }
        // goes through each of the retrieved query matched docs, and stores each as an object in resultsArray
        setResultsArray([]);
        querySnapshot.forEach((doc) => {
          // normalizes rating and reviewsAmt values, so that if a med's does not have reviews and has an undefined overall rating value, those are saved as 0
          let rating = doc.data().rating;
          if (rating === undefined) { rating = 0 };

          let reviewsAmt = doc.data().reviews;
          if (reviewsAmt === undefined) { reviewsAmt = 0 };

          setResultsArray(resultsArray => 
            [...resultsArray, ...[{medId: doc.id, genericName: doc.data().genericName, brandName: doc.data().brandName, indication: doc.data().indication, rating:rating, reviewsAmt: reviewsAmt}]]
          );
        })
        setAlertMessage("")
      }
    }

    const onChange = e => {
      setQuery(e.target.value);
    }

    // when search button is pressed, calls getData() to fetch the search results
    const onSubmit = e => {
      e.preventDefault();
      getData();
    }

    return (
      <div className='home-container'>
        <div>
          <NavbarContainer/>
        </div>  
        
        <div className="med-search-form mt-5">
          <Form data-testid="med-search-form" onSubmit={onSubmit}>
          <Form.Row className="align-items-center">
            <Col>
              {alertMessage !== "" &&  <Alert className="text-center" variant='danger'>{alertMessage}</Alert>}
              
              <h3 className="display-4 text-center mb-4">Find & Share Reviews on Medicine</h3>
              
              <Form.Row className="justify-content-center align-items-center text-center">
                <Form.Control data-testid="search-bar" size="lg" className="search-bar text-center"
                placeholder='Enter a Medication Name or Symptom to Find Reviews'
                value={query} 
                onChange={onChange}/> 

                <Form.Row className="justify-content-center" >
                  <Button data-testid="search-button" type='submit' className="search-button mt-3 mb-3" size="lg">
                    <CapsuleIcon width="29" height="29"/>
                  </Button>
                </Form.Row>
              </Form.Row >

              <Form.Row className="sort-by-dropdown text-center mt-3">
                <Form.Group controlId="sort-by">
                  <Form.Label srOnly>Sort-By</Form.Label>
                    <Form.Control defaultValue='' as="select" onChange ={e => setSortBy(e.target.value)}>
                      <option data-testid="no-sort-selected" key='noSortSelected' value='' hidden>Sort By</option>
                      <option data-testid="none-selected" value=''>Sort By: None</option>
                      <option data-testid="asc-selected" value="asc-rating">Sort By: Ascending Rating</option>
                      <option data-testid="desc-selected" value="desc-rating">Sort By: Descending Rating</option>
                    </Form.Control>
                </Form.Group>
              </Form.Row>
            
            {/* if user is logged in, button triggers rendering of RequestForm modal component 
            as pop up on page, otherwise, button redirects to LogIn.jsx */}
              <Form.Row className="justify-content-center">
                { (currentUser !== null) ? <RequestForm/> 
                  : <Button data-testid="request-button" onClick={() => history.push('/log-in')} className="mt-3 " variant="link"> 
                      Request a Medication
                    </Button>
                }
              </Form.Row>
              </Col>
            </Form.Row>
          </Form>
        </div>
        
        {/* renders search results as MedCard components with order depending on the user's sort by option select */}
        <CardDeck className="med-search-card-deck align-items-center mb-3">
          {resultsArray !== [] && sortBy === '' && resultsArray.map(med => <MedCard key={uuidv4()} med={med} />)}
          {resultsArray !== [] && sortBy === 'asc-rating' && resultsArray
                                                            .sort((a, b) => a.rating - b.rating)
                                                            .map(med => <MedCard key={uuidv4()} med={med} />)}
          {resultsArray !== [] && sortBy === 'desc-rating' && resultsArray
                                                            .sort((a, b) => b.rating - a.rating)
                                                            .map(med => <MedCard key={uuidv4()} med={med} />)}
        </CardDeck>
        
        <div>
          <HowItWorks/>
        </div> 

        <div>
          <Footer/>
        </div> 
      </div>
    )
}

export default Home;