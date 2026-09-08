/// <reference types="cypress" />

describe('E2E-001 - Création de compte', () => {

  it('should create a new account successfully', () => {

    const email = `test_${Date.now()}@example.com`;
    const password = 'Password123!';
    const fullName = 'Nohaila QA';

    cy.visit('http://localhost:4200/register');

    // 1. Saisie du nom complet (exigé par le DTO Spring Boot)
    cy.get('input#fullName, input[name="fullName"]')
      .should('be.visible')
      .type(fullName);

    // 2. Saisie de l'email
    cy.get('input#email, input[name="email"]')
      .type(email);

    // 3. Saisie du mot de passe (min 8 caractères)
    cy.get('input[name="password"]')
      .type(password);

    // 4. Intercepter l'appel API POST
    cy.intercept('POST', '**/api/auth/register').as('register');

    // 5. Cliquer sur le bouton de création
    cy.get('button[type="submit"]')
      .click();

    // 6. Assertion sur le statut HTTP (200 OK ou 201 Created)
    cy.wait('@register')
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    // 7. Vérification de la redirection vers le dashboard
    cy.url()
      .should('include', '/projects');
  });
});