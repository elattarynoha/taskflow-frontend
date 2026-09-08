/// <reference types="cypress" />

describe('E2E-003 - Création de projet', () => {

  it('should create a project successfully', () => {

    const projectTitle = `Projet Cypress ${Date.now()}`;

    const email = 'Noha@test.com';
    const password = 'Noha1234';

    cy.visit('/login');


    cy.visit('/projects');

    cy.get('[data-cy="create-project"]')
      .click();

    cy.get('[data-cy="project-title"]')
      .type(projectTitle);

    cy.get('[data-cy="project-description"]')
      .type('Projet créé automatiquement avec Cypress');

    cy.get('[data-cy="project-due-date"]')
      .type('2026-12-31');

    cy.intercept(
      'POST',
      '**/api/projects'
    ).as('createProject');

    cy.get('[data-cy="save-project"]')
      .click();

    cy.wait('@createProject')
      .then(({ response }) => {

        expect(response).to.exist;

        expect(response!.statusCode)
          .to.eq(201);

        expect(response!.body.status)
          .to.eq('ACTIVE');

      });

    cy.contains(projectTitle)
      .should('be.visible');

  });

});