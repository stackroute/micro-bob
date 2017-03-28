import RaisedButton from 'material-ui/RaisedButton';
import React, { Component } from 'react';
import {Link,hashHistory} from 'react-router';
import request from 'superagent';
import {Grid, Row, Col} from 'react-flexbox-grid/lib/index';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Request from 'superagent';
export default class Login extends React.Component
{
    render()
    {
        return(
                <Grid style={{width:'96vw',height:'100%'}}>
                    <div style={{style:'##303f9f'}}>
                        <Row center="xs">
                            <Card style={{width:'100%',maxHeight:'100%'}}>
                                <CardMedia mediaStyle={{maxHeight:'100%'}} overlayContainerStyle={{marginBottom:'10%',opacity:'0.9',backgroundColor:'none',overflow:'hidden'}}
                                    overlayContentStyle={{background:'none'}}
                                    overlay={<RaisedButton label="Login with GITHUB"
                                    href="https://github.com/login/oauth/authorize?client_id=ad2adcbfe26251810f6f" primary={true} />}
                                >
                                    <img src="http://localhost:8000/static/images/final.jpg" style={{maxHeight:'100%'}}/>
                                </CardMedia>
                            </Card>
                        </Row>
                    </div>
                </Grid>
            );
    }
}