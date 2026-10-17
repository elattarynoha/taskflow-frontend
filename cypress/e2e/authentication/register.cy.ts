/// <reference types="cypress" />

describe('E2E-001 - Création de compte', () => {

  // =========================
  // CAS PASSANT
  // =========================

  it('should create a new account successfully', () => {

    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';
    const fullName = 'Nohaila QA';

    cy.visit('http://localhost:4200/register');

    cy.get('input#fullName, input[name="fullName"]')
      .should('be.visible')
      .type(fullName);

    cy.get('input#email, input[name="email"]')
      .type(email);

    cy.get('input[name="password"]')
      .type(password);

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.wait('@register')
      .its('response.statusCode')
      .should('eq', 201);

    cy.url()
      .should('include', '/projects');
  });


  // =========================
  // EMAIL DÉJÀ UTILISÉ
  // =========================

  it('should reject an already used email', () => {

    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';
    const fullName = 'Nohaila QA';

    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/auth/register',
      body: {
        fullName,
        email,
        password
      }
    });

    cy.visit('http://localhost:4200/register');

    cy.get('input#fullName, input[name="fullName"]')
      .type(fullName);

    cy.get('input#email, input[name="email"]')
      .type(email);

    cy.get('input[name="password"]')
      .type(password);

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.wait('@register')
      .its('response.statusCode')
      .should('eq', 409);

    cy.get('[data-cy="error-message"]')
  .should('be.visible')
  .and('contain.text', 'Cette adresse e-mail est déjà utilisée');

cy.url().should('include', '/register');

// Vérifie aussi que le bug initial ne revient pas (bouton débloqué)
cy.contains('button[type="submit"]', 'Register').should('not.be.disabled');
  });


  // =========================
  // EMAIL INVALIDE
  // =========================

  it('should reject an invalid email', () => {

    const email = 'invalid-email';
    const password = 'Password123!';
    const fullName = 'Nohaila QA';

    cy.visit('http://localhost:4200/register');

    cy.get('input#fullName, input[name="fullName"]')
      .type(fullName);

    cy.get('input#email, input[name="email"]')
      .type(email);

    cy.get('input[name="password"]')
      .type(password);

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.url()
      .should('include', '/register');
  });


  // =========================
  // NOM COMPLET VIDE
  // =========================

  it('should reject an empty full name', () => {

    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';

    cy.visit('http://localhost:4200/register');

    cy.get('input#email, input[name="email"]')
      .type(email);

    cy.get('input[name="password"]')
      .type(password);

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.url()
      .should('include', '/register');
  });


  // =========================
  // EMAIL VIDE
  // =========================

  it('should reject an empty email', () => {

    const fullName = 'Nohaila QA';
    const password = 'Password123!';

    cy.visit('http://localhost:4200/register');

    cy.get('input#fullName, input[name="fullName"]')
      .type(fullName);

    cy.get('input[name="password"]')
      .type(password);

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.url()
      .should('include', '/register');
  });


  // =========================
  // MOT DE PASSE VIDE
  // =========================

  it('should reject an empty password', () => {

    const email = `test_${Date.now()}@example.com`;
    const fullName = 'Nohaila QA';

    cy.visit('http://localhost:4200/register');

    cy.get('input#fullName, input[name="fullName"]')
      .type(fullName);

    cy.get('input#email, input[name="email"]')
      .type(email);

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.url()
      .should('include', '/register');
  });


  // =========================
  // MOT DE PASSE TROP COURT
  // =========================

 it('should reject a password shorter than 8 characters', () => {

  const email = `test_${Date.now()}@example.com`;
  const fullName = 'Nohaila QA';
  const password = 'Ab1!';

  cy.visit('http://localhost:4200/register');

  cy.get('input#fullName, input[name="fullName"]')
    .should('be.visible')
    .type(fullName);

  cy.get('input#email, input[name="email"]')
    .should('be.visible')
    .type(email);

  cy.get('input[name="password"]')
    .should('be.visible')
    .and('not.be.disabled')
    .type(password);

  cy.intercept('POST', '**/api/auth/register').as('register');

  cy.get('button[type="submit"]')
    .click();

  cy.wait('@register')
    .its('response.statusCode')
    .should('eq', 400);

  cy.url()
    .should('include', '/register');
});


  // =========================
  // TOUS LES CHAMPS VIDES
  // =========================

  it('should reject empty required fields', () => {

    cy.visit('http://localhost:4200/register');

    cy.intercept('POST', '**/api/auth/register').as('register');

    cy.get('button[type="submit"]')
      .click();

    cy.url()
      .should('include', '/register');
  });

});