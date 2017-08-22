import { SiGLServicesDocumentationPage } from './app.po';

describe('si-glservices-documentation App', () => {
  let page: SiGLServicesDocumentationPage;

  beforeEach(() => {
    page = new SiGLServicesDocumentationPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
