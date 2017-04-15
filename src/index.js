import { Source, Parser, Writer } from './lib/parser';

console.log('LOG: ', 'Get Main Data');
const baseUrl = 'http://www.rentacarss.com';
Source.get(baseUrl).then(sourceCode => {
    console.log('LOG: ', 'Get Cities Source Code');
    Parser.source(sourceCode)
      .splitCode('<select class="form-control IlceDoldurAktif" id="IndexFirmaIlNo" data-rel="IndexFirmaIlceNo">                                        <option value="">.....</option>(.*?)</select>')
      .then(cityWrap => {
        console.log('LOG: ', 'Get City List');
        Parser.source(cityWrap)
          .splitItems('                                        <option value="(.*?)">(.*?)</option>', ['id', 'name'])
          // .splitItems('                                        <option value="49">Muş</option>', ['id', 'name'])
          .then(cities => {
            cities
              .map(city => {
                console.log('LOG: ', 'Get District List');
                Source.post(baseUrl + '/Servis/GetIlceAktif', { IlNo: city.id })
                  .then(districts => {
                    districts
                      .filter(item => {
                        return item.Value;
                      })
                      .map(district => {
                        console.log('LOG: ', 'Get District Source Code');
                        Source.get(baseUrl + '/servis/yonlendir?i=firmaara&ilno=' + city.id + '&ilceno=' + district.Value)
                          .then(districtSource => {
                            console.log('LOG: ', 'Get District List');
                            Parser.source(districtSource)
                              .splitItems2('                            <div class="ic-kutucuk2 vitrin-kutu">                                <img class="img-thumbnail kutu-resim" src="(.*?)" width="225" height="150" alt="(.*?)" /><br />                                <div class="baslik-yukseklik-sabitleyici">                                    <span class="uyari">                                        <b>(.*?)<br />(.*?)</b>                                    </span>                                </div>(.*?)<br />(.*?)<br />                                <a href="(.*?)" title="(.*?)">İncele</a>                            </div>', ['logo', 'pass', 'name', 'city', 'district', 'phone', 'url', 'pass'])
                              .then(rentACarList => {
                                Writer
                                  .setFolder(__dirname + '/..')
                                  .json(city.name + '/' + district.Text + '-rent-a-car.json', rentACarList)
                                  .then(err => {
                                    if (err) console.error(err);
                                    else console.log('Completed!');
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  })
  .catch(e => console.log('ERROR: ', e));
