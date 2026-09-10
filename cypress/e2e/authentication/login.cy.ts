describe('E2E-002 - Connexion utilisateur', () => {

  const email = 'Noha@test.com';
  const password = 'Noha1234';
  const fullName = 'Noha Test';

  before(() => {
    // Crée le compte s'il n'existe pas encore (idempotent : on ignore les erreurs
    // si le compte existe déjà, ex: 400/409)
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/auth/register',
      failOnStatusCode: false,
      body: {
        fullName,
        email,
        password,
      },
    });
  });

  it('should login successfully and access protected page', () => {

    cy.visit('/login');

    cy.get('input[name="email"]')
      .type(email);

    cy.get('input[name="password"]')
      .type(password);

    cy.intercept('POST', '**/api/auth/login').as('login');

    cy.get('button[type="submit"]')
      .click();

    cy.wait('@login').then((interception) => {
      expect(interception.response, 'La réponse HTTP doit exister').to.exist;

      expect(interception.response!.statusCode).to.eq(200);
      expect(interception.response!.body).to.have.property('token');
    });

    cy.url()
      .should('not.include', '/login');

    cy.visit('/projects');

    cy.url()
      .should('include', '/projects');
  });

  it('should reject invalid credentials', () => {

    cy.visit('/login');

    cy.get('input[name="email"]')
      .type('wrong@example.com');

    cy.get('input[name="password"]')
      .type('WrongPassword');

    cy.intercept('POST', '**/api/auth/login').as('login');

    cy.get('button[type="submit"]')
      .click();

    cy.wait('@login').then((interception) => {
      expect(interception.response, 'La réponse HTTP doit exister').to.exist;

      expect(interception.response!.statusCode).to.eq(401);
      expect(interception.response!.body).to.have.property('message', 'Invalid email or password');
    });

    // Vérifier que l'utilisateur reste bloqué sur /login
    cy.url()
      .should('include', '/login');

    //   // Vérifier le message d'erreur affiché à l'écran
    //   cy.contains('Invalid email or password')
    //     .should('be.visible');
  });
});