from forex_python.converter import CurrencyRates
import datetime as dt

date = dt.datetime(2019,12,31)
c = CurrencyRates()

#print(c.get_rate('USD','EUR',date))

countries = ['EUR','INR','SEK','AUD','CHF']

print('USD currency rates of {}'.format(date))
for i in countries:
    print(c.get_rate('USD',i,date))
